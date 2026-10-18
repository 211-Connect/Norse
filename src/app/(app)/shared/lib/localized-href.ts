/**
 * The locale prefix `LocalizedLink` adds to an absolute href: `/<language>`
 * for any language other than the tenant's default locale, nothing otherwise.
 */
export function localizeHref(
  href: string,
  currentLanguage: string,
  defaultLocale: string,
): string {
  if (currentLanguage !== defaultLocale && href.startsWith('/')) {
    return `/${currentLanguage}${href}`;
  }
  return href;
}

/**
 * Builds the href for a pagination page link that will be rendered through
 * `LocalizedLink`. `pathname` comes from `usePathname()`, which under
 * next-i18n-router already starts with `/<locale>` for non-default locales;
 * that segment is removed so `LocalizedLink` adding it back yields it once
 * (ISS-2404). Default-locale pathnames carry no prefix and pass through.
 * `query` is the already-stringified search string (leading `?`, or empty).
 */
export function paginationHref(
  pathname: string,
  query: string,
  currentLanguage: string,
  defaultLocale: string,
): string {
  let path = pathname;
  if (currentLanguage !== defaultLocale) {
    const prefix = `/${currentLanguage}`;
    if (path === prefix) {
      path = '/';
    } else if (path.startsWith(`${prefix}/`)) {
      path = path.slice(prefix.length);
    }
  }
  return `${path}${query}`;
}
