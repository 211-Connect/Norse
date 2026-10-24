import { request } from '@arcjet/next';
import { forbidden } from 'next/navigation';
import { after } from 'next/server';
import { cache } from 'react';

import {
  type ArcjetLog,
  type ArcjetRequestLike,
  arcjetProtect,
  isArcjetDeniedResult,
} from '@/lib/arcjet';
import { recordBlockedTraffic } from '@/lib/blocked-traffic';
import { createLogger } from '@/lib/logger';

const logger = createLogger('arcjet');

const log: ArcjetLog = (level, event, data) => {
  logger[level]({ event, ...data });
};

/**
 * One Arcjet decision per request and path. React `cache` is scoped to the
 * request, so the page and its `generateMetadata` share the decision: one
 * Decide call, one log line, one blocked-traffic count.
 */
const decide = cache(async (pathName: string) => {
  // `request()` always sets `headers` from next/headers; its declared type
  // is the wider ArcjetNextRequest, where `headers` is optional.
  const req = (await request()) as ArcjetRequestLike;
  const result = await arcjetProtect(req, pathName, log);
  if (isArcjetDeniedResult(result)) {
    // Registered before forbidden(): after() still runs when the render is
    // interrupted. Inside `decide`, so one count per request (ISS-2366).
    const host = req.headers.get('host') ?? '';
    after(() => recordBlockedTraffic(host, result, log));
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
 * Every denial, enforced or observe-only, is also counted for the tenant's
 * Blocked Bots widget in `after()`, so it never delays the response
 * (ISS-2366, docs/blocked-traffic-analytics.md).
 *
 * @param pathName  Path only, e.g. `/en/search`. Never the query string.
 */
export async function protectPage(pathName: string): Promise<void> {
  const result = await decide(pathName);
  if (result.denied) forbidden();
}
