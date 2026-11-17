import { cacheService } from '@/cacheService';

import { BUSY_TEXT, busyHeaders, renderBusyPage } from './busy-page';
import {
  LOAD_SHED_REDIS_TIMEOUT_MS,
  isLimitedMethod,
  loadShedRouteOf,
  readLoadShedLimits,
} from './config';
import { createMinuteLimiter } from './limiters';
import { reportLoadShed } from './report';
import { tenantForHost } from './tenant-registry';

/**
 * The per-tenant per-minute limit, run by the proxy before the page
 * renders: it knows the tenant (from the tenant basic config) and can
 * answer with any status. Counted in Redis across every instance. See
 * docs/load-shedding.md.
 */

const LIMITER_KEY = Symbol.for('norse.loadShed.minuteLimiter');
type GlobalWithLimiter = typeof globalThis & {
  [LIMITER_KEY]?: (key: string) => Promise<boolean>;
};

function limiter(): (key: string) => Promise<boolean> {
  const store = globalThis as GlobalWithLimiter;
  store[LIMITER_KEY] ??= createMinuteLimiter({
    max: readLoadShedLimits().maxPerMinutePerTenant,
    increment: (key, ttl) => cacheService.incrementInWindow(key, ttl),
    timeoutMs: LOAD_SHED_REDIS_TIMEOUT_MS,
  });
  return store[LIMITER_KEY];
}

export interface MinuteLimitRequest {
  method: string;
  /** Path without the base path (`request.nextUrl.pathname`). */
  pathname: string;
  host: string;
  /** True for RSC navigations: they get a plain-text 429. */
  rsc: boolean;
}

/**
 * The 429 for a request over its tenant's per-minute limit, or undefined
 * to carry on. Only full-page routes are counted (the proxy never sees
 * `/api`). Never throws: on any error the request goes through.
 */
export async function minuteLimitResponse(
  request: MinuteLimitRequest,
  tenantId: string | undefined,
): Promise<Response | undefined> {
  try {
    if (!isLimitedMethod(request.method)) return undefined;
    if (loadShedRouteOf(request.pathname, '') !== 'page') return undefined;

    const key = tenantId ?? `host:${request.host}`;
    if (await limiter()(key)) return undefined;

    reportLoadShed('minute', tenantId, request.host);
    const html = !request.rsc;
    const body =
      request.method === 'HEAD'
        ? null
        : html
          ? renderBusyPage(tenantForHost(request.host))
          : BUSY_TEXT;
    return new Response(body, { status: 429, headers: busyHeaders(html) });
  } catch {
    return undefined;
  }
}
