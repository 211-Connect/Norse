import { request } from '@arcjet/next';
import { forbidden } from 'next/navigation';
import { after } from 'next/server';
import { cache } from 'react';

import { API_URL } from '@/app/(app)/shared/lib/constants';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import {
  type ArcjetDeniedResult,
  type ArcjetLog,
  type ArcjetRequestLike,
  arcjetProtect,
  isArcjetDeniedResult,
} from '@/lib/arcjet';
import { classifyBlockedTraffic } from '@/lib/arcjet-classification';
import {
  buildBlockedTrafficEvent,
  createBlockedTrafficSender,
  resolveBlockedTrafficTarget,
} from '@/lib/blocked-traffic-events';
import { createLogger } from '@/lib/logger';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

const logger = createLogger('arcjet');

const log: ArcjetLog = (level, event, data) => {
  logger[level]({ event, ...data });
};

/**
 * ISS-2366: one `bot_blocked` Umami event per Arcjet denial, enforced or
 * not, batched per server instance and sent to Norse-API after the
 * response. One sender per instance (module scope). Never throws.
 */
const blockedTrafficSender = createBlockedTrafficSender({
  apiUrl: API_URL,
  log,
});

let blockedTrafficDropped = 0;

async function recordBlockedTraffic(
  req: ArcjetRequestLike,
  pathName: string,
  result: ArcjetDeniedResult,
): Promise<void> {
  try {
    const host = parseHost(req.headers.get('host') || '');
    // Resolved on the deny path only; findTenantByHost is cached per host.
    const tenant = await findTenantByHost(host);

    const attribution = resolveBlockedTrafficTarget(
      tenant && {
        tenantId: String(tenant.id),
        analytics: {
          umamiWebsiteId: tenant.analytics?.umamiWebsiteId,
          apiKey: tenant.analytics?.apiKey,
        },
      },
      {
        ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID:
          process.env.ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID,
        ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID:
          process.env.ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID,
        ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY:
          process.env.ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY,
      },
    );

    if (!attribution.target) {
      blockedTrafficDropped += 1;
      log('warn', 'blocked_traffic_event_dropped', {
        reason: attribution.dropped,
        droppedTotal: blockedTrafficDropped,
        host,
      });
      return;
    }

    const classified = classifyBlockedTraffic(result);
    const event = buildBlockedTrafficEvent(attribution.target.websiteId, {
      ...classified,
      source: 'page',
      enforced: result.conclusion === 'DENY',
      host,
      path: pathName,
    });

    log('debug', 'blocked_traffic_event_queued', {
      host,
      attributedTo: attribution.attributedTo,
      ...classified,
    });

    await blockedTrafficSender.enqueue(attribution.target, event);
  } catch (error) {
    log('warn', 'blocked_traffic_record_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * One Arcjet decision per request and path. React `cache` is scoped to the
 * request, so the page and its `generateMetadata` share the decision: one
 * Decide call, one log line, one `bot_blocked` event.
 */
const decide = cache(async (pathName: string) => {
  // `request()` always sets `headers` from next/headers; its declared type
  // is the wider ArcjetNextRequest, where `headers` is optional.
  const req = (await request()) as ArcjetRequestLike;
  const result = await arcjetProtect(req, pathName, log);
  if (isArcjetDeniedResult(result)) {
    // Registered before forbidden(): after() still runs when the render
    // is interrupted. Inside `decide`, so one event per request.
    after(() => recordBlockedTraffic(req, pathName, result));
  }
  return result;
});

/**
 * Bot protection for a page that serves directory data. Await it at the top
 * of the page component AND of its `generateMetadata` when that fetches
 * directory data, before any data fetch and before anything streams:
 * `forbidden()` only answers a real 403 when it is thrown before the
 * response starts. Pass the same `pathName` in both so they share one
 * decision (see `decide`).
 *
 * On a denied decision for an enforced host this throws `forbidden()`, and
 * `forbidden.tsx` renders the branded page. Otherwise it returns; it fails
 * open on a missing key or an Arcjet error.
 *
 * Every denial, enforced or observe-only, also records a `bot_blocked`
 * event in `after()`, so analytics never delays the response (ISS-2366).
 *
 * @param pathName  Path only, e.g. `/en/search`. Never the query string.
 */
export async function protectPage(pathName: string): Promise<void> {
  const result = await decide(pathName);
  if (result.denied) forbidden();
}
