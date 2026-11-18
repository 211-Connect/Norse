import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { crawlerTrafficInternalApiClient, getInternalHeaders } from '@/lib/api';
import type { ArcjetLog, ArcjetProtectResult } from '@/lib/arcjet';
import {
  classifyBlockedTraffic,
  classifyBot,
} from '@/lib/arcjet-classification';
import { getTenantByHost } from '@/lib/cms/tenants';
import {
  type CrawlerTrafficCounter,
  type CrawlerTrafficEvent,
  createCrawlerTrafficCounter,
} from '@/lib/crawler-traffic-counter';
import { describeError } from '@/lib/describe-error';
import { createLogger } from '@/lib/logger';

/** A push that takes longer is abandoned and retried on the next flush. */
export const CRAWLER_TRAFFIC_PUSH_TIMEOUT_MS = 10_000;

/**
 * Shared "unknown" tenant (nil UUID, so it passes Norse-API's `x-tenant-id`
 * check) for requests on a host that matches no tenant. Counted, not
 * dropped, so a domain missing from `trustedDomains` shows up in
 * Norse-API instead of disappearing.
 */
export const UNKNOWN_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const COUNTER_KEY = Symbol.for('norse.crawlerTrafficCounter');

type GlobalWithCounter = typeof globalThis & {
  [COUNTER_KEY]?: CrawlerTrafficCounter;
};

const logger = createLogger('crawler-traffic');
const defaultLog: ArcjetLog = (level, event, data) => {
  logger[level]({ event, ...data });
};

/**
 * The unknown tenant has no Payload document, so no Norse API key to look
 * up: it is pushed with the internal key only.
 */
function unknownTenantHeaders(): Record<string, string> {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) throw new Error('INTERNAL_API_KEY is not configured');
  return {
    'x-api-version': '1',
    'x-tenant-id': UNKNOWN_TENANT_ID,
    'x-internal-api-key': internalApiKey,
  };
}

/**
 * One counter per server process, on globalThis so a dev reload or a
 * second copy of this module in another bundle (the proxy, the
 * instrumentation hook, pages) does not start a second flush timer.
 */
function getCounter(log: ArcjetLog): CrawlerTrafficCounter {
  const store = globalThis as GlobalWithCounter;
  if (store[COUNTER_KEY]) return store[COUNTER_KEY];

  const counter = createCrawlerTrafficCounter({
    log,
    push: async (tenantId, buckets) => {
      await crawlerTrafficInternalApiClient.crawlerTrafficInternalControllerRecord(
        { buckets },
        {
          headers:
            tenantId === UNKNOWN_TENANT_ID
              ? unknownTenantHeaders()
              : await getInternalHeaders(tenantId),
          cache: 'no-store',
          signal: AbortSignal.timeout(CRAWLER_TRAFFIC_PUSH_TIMEOUT_MS),
        },
      );
    },
  });

  // Best effort: push the last partial minute when the instance is stopped
  // (deploy, scale-in). Whatever does not finish before exit is lost.
  process.once?.('SIGTERM', () => void counter.flush());

  store[COUNTER_KEY] = counter;
  return counter;
}

/** Count one request. Synchronous, never throws. */
export function recordCrawlerTraffic(
  event: CrawlerTrafficEvent,
  log: ArcjetLog = defaultLog,
): void {
  try {
    getCounter(log).record(event);
  } catch (error) {
    log('warn', 'crawler_traffic_record_failed', describeError(error));
  }
}

/**
 * What an Arcjet decision counts as, or null when it is not counted (a
 * person, or an unidentified client Arcjet let through):
 * - DENY by the rate limit → `rate_limited`; any other DENY → `blocked`;
 * - denied on an observe-only host → `logged`;
 * - allowed with an identified crawler (e.g. Googlebot) → `allowed`.
 *
 * A request carrying several crawler names is counted once, under the
 * first denied (or, when allowed, the first allowed) name.
 */
export function crawlerTrafficOf(
  result: ArcjetProtectResult,
): Omit<CrawlerTrafficEvent, 'tenantId'> | null {
  if (
    result.conclusion === 'DENY' ||
    result.conclusion === 'DENIED_NOT_ENFORCED'
  ) {
    const { classification, bot } = classifyBlockedTraffic(result);
    let outcome: CrawlerTrafficEvent['outcome'] = 'logged';
    if (result.conclusion === 'DENY') {
      outcome = result.reasonType === 'RATE_LIMIT' ? 'rate_limited' : 'blocked';
    }
    return { crawler: bot, outcome, classification };
  }

  if (
    (result.conclusion === 'ALLOW' || result.conclusion === 'CHALLENGE') &&
    result.allowedBots?.length
  ) {
    const crawler = result.allowedBots[0];
    return {
      crawler,
      outcome: 'allowed',
      classification: classifyBot(crawler).classification,
    };
  }

  return null;
}

/**
 * Count one Arcjet decision for the tenant that owns `rawHost`. Runs in
 * `after()`, so it never delays the response; never throws.
 *
 * A host that matches no tenant is counted for `UNKNOWN_TENANT_ID`. The
 * page only renders for a host the proxy resolved to a tenant, so this
 * should not happen; if it does, the counts make it visible.
 */
export async function recordArcjetTraffic(
  rawHost: string,
  result: ArcjetProtectResult,
  log: ArcjetLog = defaultLog,
): Promise<void> {
  try {
    const event = crawlerTrafficOf(result);
    if (!event) return;

    const tenant = await getTenantByHost(parseHost(rawHost));
    recordCrawlerTraffic(
      { tenantId: tenant ? String(tenant.id) : UNKNOWN_TENANT_ID, ...event },
      log,
    );
  } catch (error) {
    log('warn', 'crawler_traffic_record_failed', describeError(error));
  }
}
