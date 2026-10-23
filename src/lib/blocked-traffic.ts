import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { blockedTrafficInternalApiClient, getInternalHeaders } from '@/lib/api';
import type { ArcjetDeniedResult, ArcjetLog } from '@/lib/arcjet';
import { classifyBlockedTraffic } from '@/lib/arcjet-classification';
import {
  type BlockedTrafficCounter,
  createBlockedTrafficCounter,
} from '@/lib/blocked-traffic-counter';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

/** A push that takes longer is abandoned and retried on the next flush. */
export const BLOCKED_TRAFFIC_PUSH_TIMEOUT_MS = 10_000;

/**
 * Shared "unknown" tenant (nil UUID, so it passes Norse-API's `x-tenant-id`
 * check) for denials on a host that matches no tenant. Counted, not
 * dropped, so a domain missing from `trustedDomains` shows up in
 * Norse-API's `blocked_traffic_hourly` instead of disappearing.
 */
export const UNKNOWN_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const COUNTER_KEY = Symbol.for('norse.blockedTrafficCounter');

type GlobalWithCounter = typeof globalThis & {
  [COUNTER_KEY]?: BlockedTrafficCounter;
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
 * second copy of this module in another bundle does not start a second
 * flush timer.
 */
function getCounter(log: ArcjetLog): BlockedTrafficCounter {
  const store = globalThis as GlobalWithCounter;
  if (store[COUNTER_KEY]) return store[COUNTER_KEY];

  const counter = createBlockedTrafficCounter({
    log,
    push: async (tenantId, buckets) => {
      await blockedTrafficInternalApiClient.blockedTrafficInternalControllerRecord(
        { buckets },
        {
          headers:
            tenantId === UNKNOWN_TENANT_ID
              ? unknownTenantHeaders()
              : await getInternalHeaders(tenantId),
          cache: 'no-store',
          signal: AbortSignal.timeout(BLOCKED_TRAFFIC_PUSH_TIMEOUT_MS),
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

/**
 * Count one Arcjet denial for the tenant that owns `rawHost`. Runs in
 * `after()`, so it never delays the 403; never throws.
 *
 * A host that matches no tenant is counted for `UNKNOWN_TENANT_ID`. The
 * page only renders for a host the proxy resolved to a tenant, so this
 * should not happen; if it does, the counts make it visible.
 */
export async function recordBlockedTraffic(
  rawHost: string,
  result: ArcjetDeniedResult,
  log: ArcjetLog,
): Promise<void> {
  try {
    const host = parseHost(rawHost);
    const tenant = await findTenantByHost(host);

    const { classification } = classifyBlockedTraffic(result);
    getCounter(log).record(
      tenant ? String(tenant.id) : UNKNOWN_TENANT_ID,
      classification,
      result.conclusion === 'DENY',
    );
  } catch (error) {
    log('warn', 'blocked_traffic_record_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
