import { describeError, truncateBody } from '@/lib/describe-error';
import { createLogger } from '@/lib/logger';

import { CMS_SECRET_HEADER, getCmsUrl } from './config';

const log = createLogger('cms-client');

const DEFAULT_TIMEOUT_MS = 5_000;

export class CmsRequestError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'CmsRequestError';
  }
}

type CmsRequestOptions = {
  method?: 'GET' | 'POST';
  query?: Record<string, string>;
  /** Sent as JSON, or as is for `FormData`. */
  body?: unknown;
  timeoutMs?: number;
};

/**
 * One call to the CMS internal API (`/api/internal/*`) on `PAYLOAD_CMS_URL`.
 * Resolves to the parsed JSON body (`null` is a valid answer for lookups
 * that found nothing); throws `CmsRequestError` on a non-2xx status, a
 * timeout or a network error, after logging what came back.
 */
export async function cmsRequest<T>(
  path: string,
  {
    method = 'GET',
    query,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: CmsRequestOptions = {},
): Promise<T> {
  const cmsUrl = getCmsUrl();
  if (!cmsUrl) throw new CmsRequestError('PAYLOAD_CMS_URL is not configured');

  const apiKey = process.env.PAYLOAD_API_ROUTE_SECRET;
  if (!apiKey) {
    throw new CmsRequestError('PAYLOAD_API_ROUTE_SECRET is not configured');
  }

  const url = new URL(`${cmsUrl}/api/internal/${path}`);
  for (const [name, value] of Object.entries(query ?? {})) {
    url.searchParams.set(name, value);
  }

  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    [CMS_SECRET_HEADER]: apiKey,
  };
  if (body !== undefined && !isFormData) {
    headers['content-type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    log.error(
      { event: 'cms_request_failed', path, method, ...describeError(error) },
      'CMS internal API request failed',
    );
    throw new CmsRequestError(
      `CMS request ${method} ${path} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    const responseBody = truncateBody(await response.text().catch(() => ''));
    log.error(
      {
        event: 'cms_request_failed',
        path,
        method,
        status: response.status,
        cfRay: response.headers.get('cf-ray'),
        body: responseBody,
      },
      'CMS internal API answered with an error',
    );
    throw new CmsRequestError(
      `CMS request ${method} ${path} failed: HTTP ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}
