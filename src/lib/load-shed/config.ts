/**
 * Per-tenant load limits (docs/load-shedding.md). Pure: no Node or Next
 * imports, so the proxy, the HTTP hook and tests can all load it.
 */

export const LOAD_SHED_DEFAULT_MAX_CONCURRENT_PER_TENANT = 20;
export const LOAD_SHED_DEFAULT_MAX_PER_MINUTE_PER_TENANT = 600;
/** Sent as `Retry-After` with every 429. */
export const LOAD_SHED_RETRY_AFTER_SECONDS = 30;
/** A Redis answer slower than this is treated as no answer (fail open). */
export const LOAD_SHED_REDIS_TIMEOUT_MS = 50;

/**
 * A non-negative integer env value; `0` turns the limit off. Unset or
 * invalid falls back to the default.
 */
export function parseLimit(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') return fallback;
  const limit = Number(value);
  return Number.isInteger(limit) && limit >= 0 ? limit : fallback;
}

export interface LoadShedLimits {
  /** Requests in flight per tenant per instance; 0 = off. */
  maxConcurrentPerTenant: number;
  /** Requests per tenant per calendar minute, across instances; 0 = off. */
  maxPerMinutePerTenant: number;
}

export function readLoadShedLimits(
  env: Record<string, string | undefined> = process.env,
): LoadShedLimits {
  return {
    maxConcurrentPerTenant: parseLimit(
      env.LOAD_SHED_MAX_CONCURRENT_PER_TENANT,
      LOAD_SHED_DEFAULT_MAX_CONCURRENT_PER_TENANT,
    ),
    maxPerMinutePerTenant: parseLimit(
      env.LOAD_SHED_MAX_PER_MINUTE_PER_TENANT,
      LOAD_SHED_DEFAULT_MAX_PER_MINUTE_PER_TENANT,
    ),
  };
}

/** A path segment that is a locale (`es`, `zh-Hans`, `pt-BR`). */
const LOCALE = '[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?';

/**
 * The pages that build a full directory render: search results, a search
 * result's detail and a resource's original detail page, with or without a
 * locale prefix. RSC navigations use the same path (`?_rsc=` query).
 */
const LIMITED_PAGE = new RegExp(
  `^(?:/${LOCALE})?/(?:search(?:/[^/]+)?|details/original/[^/]+)/?$`,
);

/** Map pins: limited by concurrency only (the proxy skips `/api`). */
export const LOAD_SHED_API_PATH = '/api/search-pins';

function stripBasePath(pathname: string, basePath: string): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return '/';
  return pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length)
    : pathname;
}

/** `NEXT_PUBLIC_CUSTOM_BASE_PATH` as `/segment`, or '' when unset. */
export function normalizedBasePath(
  value: string | undefined = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH,
): string {
  return value ? `/${value.replace(/^\/+|\/+$/g, '')}` : '';
}

export type LoadShedRoute = 'page' | 'api';

/** Which limited route a pathname is, or null when it is not limited. */
export function loadShedRouteOf(
  pathname: string,
  basePath: string = normalizedBasePath(),
): LoadShedRoute | null {
  const path = stripBasePath(pathname, basePath);
  if (path === LOAD_SHED_API_PATH || path === `${LOAD_SHED_API_PATH}/`) {
    return 'api';
  }
  // `/api/search` would otherwise read as locale `api` + `/search`.
  if (path.startsWith('/api/') || path.startsWith('/_next/')) return null;
  return LIMITED_PAGE.test(path) ? 'page' : null;
}

/** Only reads are limited; a POST (server action) is left alone. */
export function isLimitedMethod(method: string | undefined): boolean {
  return method === 'GET' || method === 'HEAD';
}
