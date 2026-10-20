import { request } from '@arcjet/next';
import { forbidden } from 'next/navigation';
import { cache } from 'react';

import {
  type ArcjetLog,
  type ArcjetRequestLike,
  arcjetProtect,
} from '@/lib/arcjet';
import { createLogger } from '@/lib/logger';

const logger = createLogger('arcjet');

const log: ArcjetLog = (level, event, data) => {
  logger[level]({ event, ...data });
};

/**
 * One Arcjet decision per request and path. React `cache` is scoped to the
 * request, so the page and its `generateMetadata` share the decision: one
 * Decide call, one log line.
 */
const decide = cache(async (pathName: string) => {
  // `request()` always sets `headers` from next/headers; its declared type
  // is the wider ArcjetNextRequest, where `headers` is optional.
  const req = (await request()) as ArcjetRequestLike;
  return arcjetProtect(req, pathName, log);
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
 * @param pathName  Path only, e.g. `/en/search`. Never the query string.
 */
export async function protectPage(pathName: string): Promise<void> {
  const result = await decide(pathName);
  if (result.denied) forbidden();
}
