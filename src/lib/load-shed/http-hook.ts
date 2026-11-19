import type { IncomingMessage, ServerResponse } from 'node:http';
import http from 'node:http';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { isTelemetryReady, norseMeter } from '@/lib/telemetry/meter';

import { BUSY_TEXT, busyHeaders, renderBusyPage } from './busy-page';
import {
  isLimitedMethod,
  loadShedRouteOf,
  normalizedBasePath,
  readLoadShedLimits,
} from './config';
import { type ConcurrencyLimiter, createConcurrencyLimiter } from './limiters';
import { type LoadShedLimit, reportLoadShed } from './report';
import { type LoadShedTenant, tenantForHost } from './tenant-registry';

/**
 * The per-tenant concurrency limit, at the HTTP level: the only place that
 * sees both when a request arrives and when its response is finished
 * (`close`), whether it ends normally, errors or the client goes away.
 * Installed once per process from `register()` (instrumentation.ts), only
 * for processes that serve the public app. See docs/load-shedding.md.
 */

export interface LoadShedHandlerOptions {
  limiter: ConcurrencyLimiter;
  tenantForHost: (host: string) => LoadShedTenant | undefined;
  onShed: (
    limit: LoadShedLimit,
    tenantId: string | undefined,
    host: string,
  ) => void;
  basePath: string;
}

/** True for client-side navigations and prefetches (React Server Components). */
export function isRscRequest(
  req: Pick<IncomingMessage, 'headers' | 'url'>,
): boolean {
  return req.headers.rsc === '1' || (req.url ?? '').includes('_rsc=');
}

/** Writes the 429 for a request over a limit. */
export function writeBusyResponse(
  req: Pick<IncomingMessage, 'headers' | 'url' | 'method'>,
  res: ServerResponse,
  tenant: LoadShedTenant | undefined,
  html: boolean,
): void {
  res.writeHead(429, busyHeaders(html));
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(html ? renderBusyPage(tenant) : BUSY_TEXT);
}

/**
 * Returns a handler that either answers 429 (and returns true, so Next.js
 * never sees the request) or takes a slot released on `close` (false).
 */
export function createLoadShedHandler({
  limiter,
  tenantForHost: lookup,
  onShed,
  basePath,
}: LoadShedHandlerOptions) {
  return function handle(req: IncomingMessage, res: ServerResponse): boolean {
    try {
      if (!isLimitedMethod(req.method)) return false;
      const pathname = (req.url ?? '/').split('?', 1)[0];
      const route = loadShedRouteOf(pathname, basePath);
      if (!route) return false;

      const host = parseHost(String(req.headers.host ?? ''));
      const tenant = lookup(host);
      const key = tenant?.tenantId ?? `host:${host}`;

      const release = limiter.tryAcquire(key);
      if (!release) {
        onShed('concurrency', tenant?.tenantId, host);
        writeBusyResponse(
          req,
          res,
          tenant,
          route === 'page' && !isRscRequest(req),
        );
        return true;
      }
      res.once('close', release);
      return false;
    } catch {
      // A bug here must never take the site down: let Next.js serve it.
      return false;
    }
  };
}

const INSTALLED_KEY = Symbol.for('norse.loadShed.httpHookInstalled');
type GlobalWithHook = typeof globalThis & { [INSTALLED_KEY]?: boolean };

function observeInFlight(limiter: ConcurrencyLimiter): () => void {
  let registered = false;
  return () => {
    if (registered || !isTelemetryReady()) return;
    registered = true;
    try {
      norseMeter()
        .createObservableGauge('norse.load_shed.in_flight', {
          description:
            'Limited page requests in flight per tenant on this instance',
        })
        .addCallback((result) => {
          for (const [tenant, count] of limiter.inFlight()) {
            result.observe(count, {
              tenant: tenant.startsWith('host:') ? 'unknown' : tenant,
            });
          }
        });
    } catch {
      // Telemetry must never break a request.
    }
  };
}

/**
 * Wraps `http.Server.prototype.emit` so every `request` event passes the
 * concurrency limit first. Idempotent. Does nothing when the limit is 0.
 */
export function installLoadShedHook(): void {
  const store = globalThis as GlobalWithHook;
  if (store[INSTALLED_KEY]) return;
  store[INSTALLED_KEY] = true;

  const { maxConcurrentPerTenant } = readLoadShedLimits();
  if (maxConcurrentPerTenant <= 0) return;

  const limiter = createConcurrencyLimiter(maxConcurrentPerTenant);
  const ensureGauge = observeInFlight(limiter);
  const handle = createLoadShedHandler({
    limiter,
    tenantForHost,
    onShed: reportLoadShed,
    basePath: normalizedBasePath(),
  });

  const originalEmit = http.Server.prototype.emit;
  http.Server.prototype.emit = function emitWithLoadShed(
    this: http.Server,
    event: string | symbol,
    ...args: unknown[]
  ): boolean {
    if (event === 'request') {
      ensureGauge();
      if (handle(args[0] as IncomingMessage, args[1] as ServerResponse)) {
        return true;
      }
    }
    return originalEmit.call(this, event, ...args);
  } as typeof originalEmit;
}
