import type { SendEventDto } from '@/lib/api/generated/data-contracts';

import type { ArcjetLog } from './arcjet';
import type { BlockedTrafficClassification } from './arcjet-classification';

/**
 * ISS-2366: server-side `bot_blocked` Umami events for traffic Arcjet
 * denies in `protectPage` (`src/lib/arcjet-page.ts`). Blocked requests
 * never run the client-side
 * Umami script, so without this the analytics dashboard cannot show them.
 *
 * Events go to Norse-API `POST /analytics/events/batch`, which forwards
 * them to Umami `/api/send`. That endpoint authenticates PER TENANT
 * (`x-tenant-id` + `x-analytics-api-key`) and only accepts website ids the
 * tenant owns, so the queue is grouped by tenant and every event needs a
 * `BlockedTrafficTarget` (tenant id, analytics key, website id).
 *
 * This module has no Node imports and must never throw: the 403 must go
 * out whatever happens here. See
 * docs/blocked-traffic-analytics.md.
 */

export const BLOCKED_TRAFFIC_EVENT_NAME = 'bot_blocked' as const;

/** `source` values; only `page` is emitted today, the others are reserved. */
export type BlockedTrafficSource = 'page' | 'fingerprint-cache' | 'filter-rule';

export interface BlockedTrafficEventData {
  classification: BlockedTrafficClassification;
  /** First denied bot name, or ''. */
  bot: string;
  /** Primary Arcjet category, or ''. */
  category: string;
  /** 'bot' | 'filter' | ... */
  reason: string;
  source: BlockedTrafficSource;
  /** false for observe-only denials (host not enforced, see ARCJET_ENFORCED_HOSTS). */
  enforced: boolean;
  host: string;
  path: string;
}

/**
 * The Blocked Bots widget's bucket: the classification for a request that
 * was actually blocked, `not_enforced` for an observe-only denial (the
 * request was served). Derived in `buildBlockedTrafficEvent` so it cannot
 * disagree with `enforced`.
 */
export type BlockedTrafficSegment =
  BlockedTrafficClassification | 'not_enforced';

export function blockedTrafficSegmentOf(
  data: Pick<BlockedTrafficEventData, 'classification' | 'enforced'>,
): BlockedTrafficSegment {
  return data.enforced ? data.classification : 'not_enforced';
}

/** Where (and as whom) a batch is sent. */
export interface BlockedTrafficTarget {
  tenantId: string;
  analyticsApiKey: string;
  websiteId: string;
}

/** The slice of the per-host tenant config the attribution needs. */
export interface BlockedTrafficTenantConfig {
  tenantId?: string | null;
  analytics?: {
    umamiWebsiteId?: string | null;
    apiKey?: string | null;
  } | null;
}

export interface BlockedTrafficFallbackEnv {
  ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID?: string;
  ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID?: string;
  ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY?: string;
}

export const BLOCKED_TRAFFIC_FALLBACK_ENV_NAMES = [
  'ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID',
  'ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID',
  'ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY',
] as const;

/**
 * Deploy requirement: a production server with Arcjet on (`ARCJET_KEY`)
 * must have all three fallback vars, so denials for unknown hosts are
 * counted instead of dropped. Called from `register()` in
 * `src/instrumentation.ts`; a throw there stops `next start`, so a deploy
 * missing them fails and the previous version keeps serving. The message
 * names the missing vars, never a value.
 */
export function assertBlockedTrafficFallbackEnv(
  env: BlockedTrafficFallbackEnv & {
    NODE_ENV?: string;
    ARCJET_KEY?: string;
  },
): void {
  if (env.NODE_ENV !== 'production' || !nonEmpty(env.ARCJET_KEY)) return;
  const missing = BLOCKED_TRAFFIC_FALLBACK_ENV_NAMES.filter(
    (name) => !nonEmpty(env[name]),
  );
  if (missing.length > 0) {
    throw new Error(
      `Blocked-traffic analytics (ISS-2366) requires ${missing.join(', ')} when ARCJET_KEY is set in production. See docs/blocked-traffic-analytics.md.`,
    );
  }
}

export type BlockedTrafficDropReason =
  'no_tenant' | 'no_website_id' | 'no_analytics_key' | 'fallback_incomplete';

export type BlockedTrafficAttribution =
  | { target: BlockedTrafficTarget; attributedTo: 'tenant' | 'fallback' }
  | { target: null; dropped: BlockedTrafficDropReason };

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Pick the tenant's own website when the host resolves to a tenant with a
 * website id and an analytics key; otherwise the platform-level fallback
 * from env, when all three fallback values are set; otherwise drop.
 */
export function resolveBlockedTrafficTarget(
  tenantConfig: BlockedTrafficTenantConfig | null | undefined,
  env: BlockedTrafficFallbackEnv,
): BlockedTrafficAttribution {
  const tenantId = nonEmpty(tenantConfig?.tenantId);
  const websiteId = nonEmpty(tenantConfig?.analytics?.umamiWebsiteId);
  const analyticsApiKey = nonEmpty(tenantConfig?.analytics?.apiKey);

  if (tenantId && websiteId && analyticsApiKey) {
    return {
      target: { tenantId, websiteId, analyticsApiKey },
      attributedTo: 'tenant',
    };
  }

  const reason: BlockedTrafficDropReason = !tenantId
    ? 'no_tenant'
    : !websiteId
      ? 'no_website_id'
      : 'no_analytics_key';

  const fallbackWebsiteId = nonEmpty(
    env.ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID,
  );
  if (!fallbackWebsiteId) return { target: null, dropped: reason };

  const fallbackTenantId = nonEmpty(
    env.ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID,
  );
  const fallbackKey = nonEmpty(
    env.ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY,
  );
  if (!fallbackTenantId || !fallbackKey) {
    return { target: null, dropped: 'fallback_incomplete' };
  }

  return {
    target: {
      tenantId: fallbackTenantId,
      websiteId: fallbackWebsiteId,
      analyticsApiKey: fallbackKey,
    },
    attributedTo: 'fallback',
  };
}

/** One event in the shape Norse-API's `SendEventDto` validates. */
export function buildBlockedTrafficEvent(
  websiteId: string,
  data: BlockedTrafficEventData,
  now: Date = new Date(),
): SendEventDto {
  return {
    websiteId,
    payload: {
      name: BLOCKED_TRAFFIC_EVENT_NAME,
      data: {
        classification: data.classification,
        bot: data.bot,
        category: data.category,
        reason: data.reason,
        source: data.source,
        enforced: data.enforced,
        segment: blockedTrafficSegmentOf(data),
        host: data.host,
        path: data.path,
      },
      timestamp: now.toISOString(),
    },
  };
}

export const BLOCKED_TRAFFIC_FLUSH_INTERVAL_MS = 5_000;
export const BLOCKED_TRAFFIC_FLUSH_SIZE = 50;
/** Norse-API `SendBatchDto` is `@ArrayMaxSize(100)`. */
export const BLOCKED_TRAFFIC_MAX_BATCH = 100;
/** Events queued per instance beyond which new ones are dropped. */
export const BLOCKED_TRAFFIC_MAX_QUEUED = 1_000;

export interface BlockedTrafficSenderOptions {
  /** Norse-API base URL (`API_URL`). Unset = disabled with one warn. */
  apiUrl: string | undefined;
  log: ArcjetLog;
  fetch?: typeof fetch;
  flushIntervalMs?: number;
  flushSize?: number;
  maxBatch?: number;
  maxQueued?: number;
}

export interface BlockedTrafficSender {
  /**
   * Queue one event. Returns a promise that settles once the batch holding
   * it has been flushed (return it from the `after()` callback), or
   * `undefined` when the event was dropped. Never throws, never rejects.
   */
  enqueue(
    target: BlockedTrafficTarget,
    event: SendEventDto,
  ): Promise<void> | undefined;
  /** Send everything queued now. Never throws, never rejects. */
  flush(): Promise<void>;
  /** Events currently queued (all tenants). */
  size(): number;
}

type Group = { target: BlockedTrafficTarget; events: SendEventDto[] };

export function createBlockedTrafficSender(
  options: BlockedTrafficSenderOptions,
): BlockedTrafficSender {
  const {
    apiUrl,
    log,
    flushIntervalMs = BLOCKED_TRAFFIC_FLUSH_INTERVAL_MS,
    flushSize = BLOCKED_TRAFFIC_FLUSH_SIZE,
    maxBatch = BLOCKED_TRAFFIC_MAX_BATCH,
    maxQueued = BLOCKED_TRAFFIC_MAX_QUEUED,
  } = options;
  const doFetch = options.fetch ?? globalThis.fetch;

  const groups = new Map<string, Group>();
  let queued = 0;
  let warnedDisabled = false;
  let droppedQueueFull = 0;

  function size() {
    return queued;
  }

  async function postBatch(
    target: BlockedTrafficTarget,
    events: SendEventDto[],
  ) {
    const url = `${apiUrl!.replace(/\/$/, '')}/analytics/events/batch`;
    try {
      const response = await doFetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-version': '1',
          'x-tenant-id': target.tenantId,
          'x-analytics-api-key': target.analyticsApiKey,
        },
        body: JSON.stringify({ events }),
        cache: 'no-store',
      });
      if (!response.ok) {
        log('warn', 'blocked_traffic_batch_rejected', {
          tenantId: target.tenantId,
          websiteId: target.websiteId,
          status: response.status,
          count: events.length,
        });
        return;
      }
      log('debug', 'blocked_traffic_batch_sent', {
        tenantId: target.tenantId,
        websiteId: target.websiteId,
        count: events.length,
      });
    } catch (error) {
      log('warn', 'blocked_traffic_batch_failed', {
        tenantId: target.tenantId,
        websiteId: target.websiteId,
        count: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function flush(): Promise<void> {
    try {
      const snapshot = [...groups.values()];
      groups.clear();
      queued = 0;
      const posts: Promise<void>[] = [];
      for (const group of snapshot) {
        for (let i = 0; i < group.events.length; i += maxBatch) {
          posts.push(
            postBatch(group.target, group.events.slice(i, i + maxBatch)),
          );
        }
      }
      await Promise.all(posts);
    } catch (error) {
      // postBatch never throws; this guards the bookkeeping above.
      log('warn', 'blocked_traffic_flush_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  type Timer = {
    promise: Promise<void>;
    resolve: () => void;
    handle: ReturnType<typeof setTimeout>;
  };
  let timer: Timer | null = null;

  /** One timer per instance; its promise settles when that flush is done. */
  function scheduleFlush(): Promise<void> {
    if (timer) return timer.promise;
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    const handle = setTimeout(() => {
      const current = timer;
      timer = null;
      flush().then(current?.resolve, current?.resolve);
    }, flushIntervalMs);
    timer = { promise, resolve, handle };
    return promise;
  }

  /** Flush now; also settles the timer promise so earlier callers finish. */
  function flushNow(): Promise<void> {
    const current = timer;
    timer = null;
    if (current) clearTimeout(current.handle);
    const done = flush();
    if (current) done.then(current.resolve, current.resolve);
    return done;
  }

  function enqueue(
    target: BlockedTrafficTarget,
    event: SendEventDto,
  ): Promise<void> | undefined {
    try {
      if (!apiUrl) {
        if (!warnedDisabled) {
          warnedDisabled = true;
          log('warn', 'blocked_traffic_sender_disabled', {
            reason: 'API_URL is not set',
          });
        }
        return undefined;
      }

      if (queued >= maxQueued) {
        droppedQueueFull += 1;
        log('warn', 'blocked_traffic_event_dropped', {
          reason: 'queue_full',
          droppedTotal: droppedQueueFull,
          queued,
        });
        return undefined;
      }

      const key = `${target.tenantId}\u0000${target.websiteId}\u0000${target.analyticsApiKey}`;
      let group = groups.get(key);
      if (!group) {
        group = { target, events: [] };
        groups.set(key, group);
      }
      group.events.push(event);
      queued += 1;

      if (queued >= flushSize) return flushNow();
      return scheduleFlush();
    } catch (error) {
      log('warn', 'blocked_traffic_enqueue_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  return { enqueue, flush, size };
}
