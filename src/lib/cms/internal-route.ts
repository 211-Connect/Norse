import { createLogger } from '@/lib/logger';
import { runsPayload } from '@/lib/norse-role';
import { secretsMatch } from '@/lib/secrets';

import { CMS_SECRET_HEADER } from './config';

const log = createLogger('cms-internal-api');

/** Whether `request` carries the CMS internal API key. */
export function isInternalRequest(request: Request): boolean {
  return secretsMatch(
    request.headers.get(CMS_SECRET_HEADER),
    process.env.PAYLOAD_API_ROUTE_SECRET,
  );
}

/** 404 in the public app (`NORSE_ROLE=app`), which has no database. */
export function cmsOnly<A extends unknown[]>(
  handler: (request: Request, ...args: A) => Promise<Response> | Response,
): (request: Request, ...args: A) => Promise<Response> {
  return async (request, ...args) => {
    if (!runsPayload()) return new Response('Not Found', { status: 404 });
    return handler(request, ...args);
  };
}

/**
 * A CMS internal API route (`/api/internal/*`): CMS only, requires the
 * internal key, and answers JSON. The handler's return value is the body;
 * `null` is a valid "not found" answer for lookups.
 */
export function internalRoute<A extends unknown[]>(
  handler: (request: Request, ...args: A) => Promise<unknown>,
): (request: Request, ...args: A) => Promise<Response> {
  return cmsOnly(async (request: Request, ...args: A) => {
    if (!isInternalRequest(request)) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const body = await handler(request, ...args);
      if (body instanceof Response) return body;
      return Response.json(body ?? null);
    } catch (error) {
      log.error(
        { err: error, path: new URL(request.url).pathname },
        'CMS internal API route failed',
      );
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  });
}

/** A required query parameter, or a 400 response. */
export function requireParam(
  request: Request,
  name: string,
): string | Response {
  const value = new URL(request.url).searchParams.get(name);
  return value
    ? value
    : Response.json({ error: `${name} is required` }, { status: 400 });
}
