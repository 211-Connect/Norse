/**
 * Checks whether a pathname points at the search results page, tolerant of
 * a locale prefix (e.g. `/en/search`) and of trailing slashes (some tenants
 * run with `NEXT_PUBLIC_WITH_TRAILING_SLASHES=true`, see `next.config.js`).
 */
export function isSearchPathname(pathname: string | null | undefined): boolean {
  if (pathname == null) return false;
  return pathname.endsWith('/search') || pathname.endsWith('/search/');
}
