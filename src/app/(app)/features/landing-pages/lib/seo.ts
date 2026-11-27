/**
 * Canonical and hreflang URLs of a landing page, and where its redirects go
 * (docs/landing-pages.md, "The page"). Pure.
 */
import { localizedLandingHref } from './slugs';

/**
 * A redirect target as a site path in the page's locale: a landing path
 * (`topic/place`) or a stored site path (`/search?…`), with the locale prefix
 * the tenant uses for that locale.
 */
export function redirectHref(
  target: string,
  locale: string,
  defaultLocale: string,
): string {
  if (!target.startsWith('/')) {
    return localizedLandingHref(target, locale, defaultLocale);
  }
  return locale === defaultLocale ? target : `/${locale}${target}`;
}

/**
 * The page's canonical URL and its language versions (`x-default` is the
 * default locale's), on the canonical host. Page 2 onwards keeps `?page=n`,
 * so each page of results is its own canonical page.
 */
export function landingAlternates({
  origin,
  locale,
  defaultLocale,
  alternates,
  page,
}: {
  /** `https://search.example.org`. */
  origin: string;
  locale: string;
  defaultLocale: string;
  /** Locale → current path without prefix. */
  alternates: Record<string, string>;
  page: number;
}): { canonical: string; languages: Record<string, string> } {
  const suffix = page > 1 ? `?page=${page}` : '';
  const url = (pathLocale: string, path: string) =>
    `${origin}${localizedLandingHref(path, pathLocale, defaultLocale)}${suffix}`;
  const languages: Record<string, string> = {};
  for (const [pathLocale, path] of Object.entries(alternates)) {
    languages[pathLocale] = url(pathLocale, path);
  }
  const fallback = alternates[defaultLocale];
  if (fallback) languages['x-default'] = url(defaultLocale, fallback);
  return {
    canonical: url(locale, alternates[locale] ?? Object.values(alternates)[0]),
    languages,
  };
}

/**
 * schema.org `BreadcrumbList` for the page's breadcrumbs, as the text of a
 * `<script type="application/ld+json">`. The last crumb (the page itself) has
 * no link and gets the page's own URL. `<` is escaped so no text can close
 * the script element.
 */
export function breadcrumbJsonLd(
  crumbs: readonly { label: string; href?: string }[],
  origin: string,
  pagePath: string,
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${origin}${crumb.href ?? pagePath}`,
    })),
  }).replace(/</g, '\\u003c');
}
