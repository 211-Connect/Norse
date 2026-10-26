import type { BlockedTrafficBucketDto } from '@/lib/api/generated/data-contracts';
import type { ArcjetLog } from '@/lib/arcjet';
import type { BlockedTrafficClassification } from '@/lib/arcjet-classification';

/**
 * ISS-2366: per-instance in-memory counters of Arcjet denials, pushed to
 * Norse-API once a minute as per-tenant, per-hour deltas. One small request
 * per tenant per instance per minute, however many bots hit the site, and
 * no per-request work beyond a Map increment. See
 * docs/blocked-traffic-analytics.md.
 */

export const BLOCKED_TRAFFIC_FLUSH_INTERVAL_MS = 60_000;

/**
 * Buckets this old are dropped instead of being retried. Bounds memory
 * during a long Norse-API outage (≤ 25 hours × 6 buckets per tenant, under
 * Norse-API's 500-buckets-per-push cap) and stays inside its 7-day window.
 */
export const BLOCKED_TRAFFIC_MAX_RETAINED_MS = 24 * 60 * 60_000;

const ONE_HOUR_MS = 60 * 60_000;

function floorToHour(ms: number): number {
  return Math.floor(ms / ONE_HOUR_MS) * ONE_HOUR_MS;
}

interface Bucket {
  tenantId: string;
  hour: number;
  classification: BlockedTrafficClassification;
  enforced: boolean;
  count: number;
}

export type BlockedTrafficPush = (
  tenantId: string,
  buckets: BlockedTrafficBucketDto[],
) => Promise<void>;

export interface BlockedTrafficCounterOptions {
  push: BlockedTrafficPush;
  log: ArcjetLog;
  now?: () => number;
  /** Starts the periodic flush; called once, on the first `record`. */
  schedule?: (flush: () => void) => void;
}

export interface BlockedTrafficCounter {
  /** Count one denial in the current hour. Synchronous, never throws. */
  record(
    tenantId: string,
    classification: BlockedTrafficClassification,
    enforced: boolean,
  ): void;
  /**
   * Push everything counted so far. Failed tenants are added back for the
   * next flush. Concurrent calls share one in-flight flush. Never rejects.
   */
  flush(): Promise<void>;
  /** Denials counted and not yet pushed (tests, logs). */
  pendingCount(): number;
}

function defaultSchedule(flush: () => void): void {
  // unref: the timer must not keep a finishing process alive.
  setInterval(flush, BLOCKED_TRAFFIC_FLUSH_INTERVAL_MS).unref?.();
}

export function createBlockedTrafficCounter({
  push,
  log,
  now = Date.now,
  schedule = defaultSchedule,
}: BlockedTrafficCounterOptions): BlockedTrafficCounter {
  let counts = new Map<string, Bucket>();
  let inFlight: Promise<void> | null = null;
  let scheduled = false;

  function add(bucket: Bucket): void {
    const key = `${bucket.tenantId}|${bucket.hour}|${bucket.classification}|${bucket.enforced}`;
    const existing = counts.get(key);
    if (existing) existing.count += bucket.count;
    else counts.set(key, { ...bucket });
  }

  async function pushTenant(tenantId: string, buckets: Bucket[]) {
    try {
      await push(
        tenantId,
        buckets.map(({ hour, classification, enforced, count }) => ({
          hour: new Date(hour).toISOString(),
          classification,
          enforced,
          count,
        })),
      );
    } catch (error) {
      const oldest = floorToHour(now() - BLOCKED_TRAFFIC_MAX_RETAINED_MS);
      let requeued = 0;
      let dropped = 0;
      for (const bucket of buckets) {
        if (bucket.hour >= oldest) {
          add(bucket);
          requeued += bucket.count;
        } else {
          dropped += bucket.count;
        }
      }
      log('warn', 'blocked_traffic_push_failed', {
        tenantId,
        requeued,
        dropped,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function runFlush(): Promise<void> {
    // Swap first: denials recorded while the push is in flight go to the
    // new map and are pushed next time.
    const batch = counts;
    counts = new Map();
    if (batch.size === 0) return;

    const byTenant = new Map<string, Bucket[]>();
    for (const bucket of batch.values()) {
      const list = byTenant.get(bucket.tenantId);
      if (list) list.push(bucket);
      else byTenant.set(bucket.tenantId, [bucket]);
    }

    await Promise.all(
      [...byTenant].map(([tenantId, buckets]) => pushTenant(tenantId, buckets)),
    );
  }

  function flush(): Promise<void> {
    inFlight ??= runFlush()
      .catch((error) => {
        log('warn', 'blocked_traffic_flush_failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  function record(
    tenantId: string,
    classification: BlockedTrafficClassification,
    enforced: boolean,
  ): void {
    add({
      tenantId,
      hour: floorToHour(now()),
      classification,
      enforced,
      count: 1,
    });
    if (!scheduled) {
      scheduled = true;
      schedule(() => void flush());
    }
  }

  function pendingCount(): number {
    let total = 0;
    for (const bucket of counts.values()) total += bucket.count;
    return total;
  }

  return { record, flush, pendingCount };
}
