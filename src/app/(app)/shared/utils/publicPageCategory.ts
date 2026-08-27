import { getNormalizedCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { localeSet } from '@/payload/i18n/locales';
import { Tenant } from '@/payload/payload-types';

export type PublicPageCategory = NonNullable<
  Tenant['auth']['publicPages']
>[number];

function stripCustomBasePath(pathname: string): string {
  const normalizedBasePath = getNormalizedCustomBasePath();
  if (!normalizedBasePath) {
    return pathname;
  }

  if (pathname === normalizedBasePath) {
    return '/';
  }

  if (pathname.startsWith(`${normalizedBasePath}/`)) {
    return pathname.slice(normalizedBasePath.length) || '/';
  }

  return pathname;
}

function getPathSegments(pathname: string): string[] {
  const withoutBasePath = stripCustomBasePath(pathname);
  const segments = withoutBasePath.split('/').filter(Boolean);

  if (segments.length > 0 && localeSet.has(segments[0])) {
    segments.shift();
  }

  return segments;
}

/**
 * Classifies a raw request pathname (optionally prefixed with the custom
 * base path and/or a locale segment) into one of the known public-page
 * categories, or `null` if it doesn't match any of them (i.e. it must stay
 * behind the login wall).
 *
 * This is intentionally standalone rather than reusing the `CDN_CACHE_POLICIES`
 * regexes in `src/proxy.ts`: cache-control mismatches are low-risk, but a
 * shared matcher drifting would risk silently loosening the login wall.
 */
export function getPublicPageCategory(
  pathname: string,
): PublicPageCategory | null {
  const segments = getPathSegments(pathname);

  if (segments.length === 0) {
    return 'home';
  }

  if (segments[0] === 'search') {
    if (segments.length === 1) {
      return 'search-results';
    }
    if (segments.length === 2 && segments[1]) {
      return 'resource-detail';
    }
    return null;
  }

  if (segments[0] === 'favorites') {
    if (segments.length === 2 && segments[1] && segments[1] !== 'local') {
      return 'favorites-list';
    }
    return null;
  }

  return null;
}

export function isShareLinkPath(pathname: string): boolean {
  const segments = getPathSegments(pathname);
  return (
    segments.length === 2 && segments[0] === 'share' && Boolean(segments[1])
  );
}
