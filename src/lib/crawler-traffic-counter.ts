import { ROOT_CONTEXT, context } from '@opentelemetry/api';

import type { CrawlerTrafficBucketDto } from '@/lib/api/generated/data-contracts';
import type { BlockedTrafficClassification } from '@/lib/arcjet-classification';
import type { ArcjetLog } from '@/lib/arcjet/types';
import { describeError } from '@/lib/describe-error';

/**
 * Per-instance in-memory counters of requests per tenant, crawler and
 * outcome, pushed to Norse-API once a minute as per-hour deltas. One small
 * request per tenant per instance per minute, however many bots hit the
 * site, and no per-request work beyond a Map increment. See
 * docs/blocked-traffic-analytics.md.
 */

export const CRAWLER_TRAFFIC_FLUSH_INTERVAL_MS = 60_000;

/**
 * Buckets this old are dropped instead of being retried. Bounds memory
 * during a long Norse-API outage and stays inside its 7-day window.
 */
export const CRAWLER_TRAFFIC_MAX_RETAINED_MS = 24 * 60 * 60_000;

/** Norse-API accepts at most this many buckets in one push. */
export const CRAWLER_TRAFFIC_MAX_BUCKETS_PER_PUSH = 1000;

/**
 * Distinct buckets kept per instance between flushes. Crawler names come
 * from Arcjet's fixed list, so this is only reached if something goes
 * wrong; further new buckets are dropped (and logged) rather than growing
 * memory without bound.
 */
export const CRAWLER_TRAFFIC_MAX_PENDING_BUCKETS = 20_000;

export type CrawlerTrafficOutcome = CrawlerTrafficBucketDto['outcome'];

const ONE_HOUR_MS = 60 * 60_000;

function floorToHour(ms: number): number {
  return Math.floor(ms / ONE_HOUR_MS) * ONE_HOUR_MS;
}

export interface CrawlerTrafficEvent {
  tenantId: string;
  /** Arcjet bot name; '' when none was identified. */
  crawler: string;
  outcome: CrawlerTrafficOutcome;
  classification: BlockedTrafficClassification;
}

interface Bucket extends CrawlerTrafficEvent {
  hour: number;
  count: number;
}

export type CrawlerTrafficPush = (
  tenantId: string,
  buckets: CrawlerTrafficBucketDto[],
) => Promise<void>;

export interface CrawlerTrafficCounterOptions {
  push: CrawlerTrafficPush;
  log: ArcjetLog;
  now?: () => number;
  /** Starts the periodic flush; called once, on the first `record`. */
  schedule?: (flush: () => void) => void;
}

export interface CrawlerTrafficCounter {
  /** Count one request in the current hour. Synchronous, never throws. */
  record(event: CrawlerTrafficEvent): void;
  /**
   * Push everything counted so far. Failed tenants are added back for the
   * next flush. Concurrent calls share one in-flight flush. Never rejects.
   */
  flush(): Promise<void>;
  /** Requests counted and not yet pushed (tests, logs). */
  pendingCount(): number;
}

export function defaultSchedule(
  flush: () => void,
  intervalMs: number = CRAWLER_TRAFFIC_FLUSH_INTERVAL_MS,
): void {
  // ROOT_CONTEXT: the first record arms this inside a request, and a timer
  // keeps the async context it was created in, so every flush for the life
  // of the process would join that request's trace.
  context.with(ROOT_CONTEXT, () => {
    // unref: the timer must not keep a finishing process alive.
    setInterval(flush, intervalMs).unref?.();
  });
}

export function createCrawlerTrafficCounter({
  push,
  log,
  now = Date.now,
  schedule = defaultSchedule,
}: CrawlerTrafficCounterOptions): CrawlerTrafficCounter {
  let counts = new Map<string, Bucket>();
  let inFlight: Promise<void> | null = null;
  let scheduled = false;
  let droppedSinceLog = 0;

  function add(bucket: Bucket): void {
    const key = `${bucket.tenantId}|${bucket.hour}|${bucket.crawler}|${bucket.outcome}|${bucket.classification}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += bucket.count;
    } else if (counts.size >= CRAWLER_TRAFFIC_MAX_PENDING_BUCKETS) {
      droppedSinceLog += bucket.count;
    } else {
      counts.set(key, { ...bucket });
    }
  }

  async function pushTenant(tenantId: string, buckets: Bucket[]) {
    for (
      let start = 0;
      start < buckets.length;
      start += CRAWLER_TRAFFIC_MAX_BUCKETS_PER_PUSH
    ) {
      const chunk = buckets.slice(
        start,
        start + CRAWLER_TRAFFIC_MAX_BUCKETS_PER_PUSH,
      );
      try {
        await push(
          tenantId,
          chunk.map(({ hour, crawler, outcome, classification, count }) => ({
            hour: new Date(hour).toISOString(),
            crawler,
            outcome,
            classification,
            count,
          })),
        );
      } catch (error) {
        const oldest = floorToHour(now() - CRAWLER_TRAFFIC_MAX_RETAINED_MS);
        let requeued = 0;
        let dropped = 0;
        for (const bucket of chunk) {
          if (bucket.hour >= oldest) {
            add(bucket);
            requeued += bucket.count;
          } else {
            dropped += bucket.count;
          }
        }
        log('warn', 'crawler_traffic_push_failed', {
          tenantId,
          requeued,
          dropped,
          ...describeError(error),
        });
      }
    }
  }

  async function runFlush(): Promise<void> {
    if (droppedSinceLog > 0) {
      log('warn', 'crawler_traffic_buckets_full', {
        dropped: droppedSinceLog,
        maxPendingBuckets: CRAWLER_TRAFFIC_MAX_PENDING_BUCKETS,
      });
      droppedSinceLog = 0;
    }

    // Swap first: requests recorded while the push is in flight go to the
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
        log('warn', 'crawler_traffic_flush_failed', describeError(error));
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  function record(event: CrawlerTrafficEvent): void {
    try {
      add({ ...event, hour: floorToHour(now()), count: 1 });
      if (!scheduled) {
        scheduled = true;
        schedule(() => void flush());
      }
    } catch {
      // Counting must never break a request.
    }
  }

  function pendingCount(): number {
    let total = 0;
    for (const bucket of counts.values()) total += bucket.count;
    return total;
  }

  return { record, flush, pendingCount };
}
