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

const COUNTER_KEY = Symbol.for('norse.blockedTrafficCounter');

type GlobalWithCounter = typeof globalThis & {
  [COUNTER_KEY]?: BlockedTrafficCounter;
};

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
          headers: await getInternalHeaders(tenantId),
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
 * A host that matches no tenant is not counted: the page only renders for
 * a host the proxy resolved to a tenant, so this does not happen in
 * practice.
 */
export async function recordBlockedTraffic(
  rawHost: string,
  result: ArcjetDeniedResult,
  log: ArcjetLog,
): Promise<void> {
  try {
    const host = parseHost(rawHost);
    const tenant = await findTenantByHost(host);
    if (!tenant) return;

    const { classification } = classifyBlockedTraffic(result);
    getCounter(log).record(
      String(tenant.id),
      classification,
      result.conclusion === 'DENY',
    );
  } catch (error) {
    log('warn', 'blocked_traffic_record_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
