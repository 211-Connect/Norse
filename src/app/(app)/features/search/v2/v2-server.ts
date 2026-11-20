import { API_URL } from '@/app/(app)/shared/lib/constants';
import { getTenantApiKey } from '@/lib/api/getTenantApiKey';
import { createLogger } from '@/lib/logger';

import type { V2Response } from './v2-contract';
import { buildV2Headers, buildV2Url } from './v2-request';

const log = createLogger('v2-server');

const TIMEOUT_MS = 6000;

/**
 * Prototype: `GET /v2/search` from the server, for the first results in the HTML. Same helpers as
 * the page's route handler (`api/v2-search/route.ts`). Any failure returns null, and the page
 * renders its shell as before: no throw, no error page.
 */
export async function fetchV2Server(
  incoming: Pick<URLSearchParams, 'get'>,
  tenantId: string,
  /** The route's locale (`/es/search` is `es`), sent as it is. */
  locale?: string,
): Promise<V2Response | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(
      buildV2Url(
        API_URL,
        {
          get: (key) =>
            key === 'locale' && locale ? locale : incoming.get(key),
        },
        tenantId,
      ),
      {
        headers: buildV2Headers(await getTenantApiKey(tenantId)),
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      log.warn({ status: res.status }, 'v2 search failed on the server');
      return null;
    }
    const body = (await res.json()) as V2Response;
    return body?.search?.hits ? body : null;
  } catch (err) {
    log.warn({ err }, 'v2 search failed on the server');
    return null;
  }
}
