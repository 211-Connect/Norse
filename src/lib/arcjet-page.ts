import { request } from '@arcjet/next';
import { forbidden } from 'next/navigation';

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
 * Bot protection for a page that serves directory data. Call it once per
 * request, awaited, at the top of the page component, before any data
 * fetch and before anything streams: `forbidden()` only answers a real 403
 * when it is thrown before the response starts.
 *
 * On a denied decision for an enforced host this throws `forbidden()`, and
 * `forbidden.tsx` renders the branded page. Otherwise it returns; it fails
 * open on a missing key or an Arcjet error.
 *
 * @param pathName  Path only, e.g. `/en/search`. Never the query string.
 */
export async function protectPage(pathName: string): Promise<void> {
  // `request()` always sets `headers` from next/headers; its declared type
  // is the wider ArcjetNextRequest, where `headers` is optional.
  const req = (await request()) as ArcjetRequestLike;
  const result = await arcjetProtect(req, pathName, log);
  if (result.denied) forbidden();
}
