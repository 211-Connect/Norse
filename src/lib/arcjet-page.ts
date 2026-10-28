import { request } from '@arcjet/next';
import { forbidden } from 'next/navigation';
import { after } from 'next/server';
import { cache } from 'react';

import {
  type ArcjetLog,
  type ArcjetRequestLike,
  arcjetProtect,
  isArcjetDeniedResult,
  isEnforcedHost,
} from '@/lib/arcjet';
import { recordBlockedTraffic } from '@/lib/blocked-traffic';
import { createLogger } from '@/lib/logger';

const logger = createLogger('arcjet');

const log: ArcjetLog = (level, event, data) => {
  logger[level]({ event, ...data });
};

/**
 * The request as Arcjet reads it, once per request. `request()` reads
 * headers and cookies eagerly, so the result stays usable inside `after()`,
 * where request APIs cannot be called.
 */
const arcjetRequest = cache(async () => {
  // `request()` always sets `headers` from next/headers; its declared type
  // is the wider ArcjetNextRequest, where `headers` is optional.
  return (await request()) as ArcjetRequestLike;
});

/**
 * One Arcjet decision; a denial, enforced or not, is also counted for the
 * Blocked Bots widget (ISS-2366). While the response is still pending the
 * count is deferred to `after()` so it never delays it; `afterResponse`
 * means we already run there and count directly.
 */
async function decideAndCount(
  req: ArcjetRequestLike,
  pathName: string,
  afterResponse: boolean,
) {
  const result = await arcjetProtect(req, pathName, log);
  if (isArcjetDeniedResult(result)) {
    const host = req.headers.get('host') ?? '';
    const count = () => recordBlockedTraffic(host, result, log);
    if (afterResponse) await count();
    else after(count);
  }
  return result;
}

/**
 * Enforced hosts: one Arcjet decision per request and path, awaited before
 * the page renders. React `cache` is scoped to the request, so the page and
 * its `generateMetadata` share the decision: one Decide call, one log line,
 * one blocked-traffic count.
 */
const decide = cache(async (pathName: string) =>
  decideAndCount(await arcjetRequest(), pathName, false),
);

/**
 * Observe-only hosts: the decision cannot change the response, so it runs
 * in `after()` and never delays the page. `cache` schedules it once per
 * request although the page and `generateMetadata` both call `protectPage`.
 */
const observe = cache(async (pathName: string) => {
  const req = await arcjetRequest();
  after(() => decideAndCount(req, pathName, true));
});

/**
 * Bot protection for a page that serves directory data. Await it at the top
 * of the page component AND of its `generateMetadata` when that fetches
 * directory data, before any data fetch and before anything streams:
 * `forbidden()` only answers a real 403 when it is thrown before the
 * response starts. Pass the same `pathName` in both so they share one
 * decision.
 *
 * Only an enforced host (`ARCJET_ENFORCED_HOSTS`) waits for the decision:
 * on a denial this throws `forbidden()`, and `forbidden.tsx` renders the
 * branded page. On every other host the decision runs after the response,
 * so Arcjet adds no latency where a denial would only be logged. Either way
 * it fails open on a missing key or an Arcjet error.
 *
 * @param pathName  Path only, e.g. `/en/search`. Never the query string.
 */
export async function protectPage(pathName: string): Promise<void> {
  const req = await arcjetRequest();
  if (!isEnforcedHost(req)) {
    await observe(pathName);
    return;
  }
  const result = await decide(pathName);
  if (result.denied) forbidden();
}
