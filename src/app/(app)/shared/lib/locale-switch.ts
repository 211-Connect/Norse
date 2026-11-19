/** The path without its leading locale segment (`/es/search` → `/search`, `/es` → `/`). */
export function withoutLocalePrefix(pathname: string, locale: string): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return '/';
  return pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname;
}

/**
 * Where the language switcher goes from `pathname` (current locale `from`) to `to`.
 *
 * - `href`: the client navigation, once the locale cookie says `to`. The default locale is unprefixed, so
 *   switching to it goes straight to `/search?…` instead of through the proxy's `/en/…` redirect.
 * - `pageLoadHref`: always prefixed. A page load of a prefixed path makes the proxy write the cookie itself,
 *   so it works when the cookie could not be set first.
 */
export function localeSwitchHrefs({
  pathname,
  search,
  from,
  to,
  defaultLocale,
}: {
  pathname: string;
  search: string;
  from: string;
  to: string;
  defaultLocale: string;
}): { href: string; pageLoadHref: string } {
  const path = withoutLocalePrefix(pathname, from);
  const prefixed = `/${to}${path === '/' ? '' : path}${search}`;
  return {
    href: to === defaultLocale ? `${path}${search}` : prefixed,
    pageLoadHref: prefixed,
  };
}
