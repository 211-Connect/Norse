/**
 * XML sitemaps of landing pages (docs/landing-pages.md, "Sitemaps"): an
 * index at `/sitemap.xml` and `/sitemaps/landing-{n}.xml` files of up to
 * 10,000 URLs, each URL with its language versions. Pure.
 */
import { localizedLandingHref } from './slugs';
import type { LandingSitemap } from './types';

/** URLs per child sitemap (the protocol allows 50,000; smaller files are cheaper to rebuild). */
export const SITEMAP_PAGE_SIZE = 10_000;

/** `landing-3.xml` → 3; anything else → null. */
export function landingSitemapNumber(file: string): number | null {
  const match = /^landing-([1-9]\d{0,5})\.xml$/.exec(file);
  return match ? Number(match[1]) : null;
}

export type SitemapUrl = {
  loc: string;
  /** ISO date. */
  lastmod: string;
  /** hreflang → URL, `x-default` included. */
  alternates: Record<string, string>;
};

/**
 * One URL per page and locale, each listing every locale version of its
 * page plus `x-default` (the default locale's). Ordered by page, then
 * locale, so a page's files stay stable between builds.
 */
export function landingSitemapUrls(
  sitemap: LandingSitemap,
  { origin, defaultLocale }: { origin: string; defaultLocale: string },
): SitemapUrl[] {
  const entries = [...sitemap.entries].sort((a, b) =>
    a.id.localeCompare(b.id, 'en', { numeric: true }),
  );
  return entries.flatMap((entry) => {
    const locales = Object.keys(entry.paths).sort();
    const url = (locale: string) =>
      `${origin}${localizedLandingHref(entry.paths[locale], locale, defaultLocale)}`;
    const alternates: Record<string, string> = {};
    for (const locale of locales) alternates[locale] = url(locale);
    if (entry.paths[defaultLocale]) {
      alternates['x-default'] = url(defaultLocale);
    }
    return locales.map((locale) => ({
      loc: url(locale),
      lastmod: entry.lastModified,
      alternates,
    }));
  });
}

/** How many `landing-{n}.xml` files `urls` fill. */
export function sitemapPageCount(urls: readonly unknown[]): number {
  return Math.ceil(urls.length / SITEMAP_PAGE_SIZE);
}

/** The URLs of `landing-{n}.xml` (from 1). */
export function sitemapPage<T>(urls: readonly T[], n: number): T[] {
  return urls.slice((n - 1) * SITEMAP_PAGE_SIZE, n * SITEMAP_PAGE_SIZE);
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** `2026-11-24T10:00:00.000Z` → `2026-11-24` (W3C date). */
const w3cDate = (iso: string) => iso.slice(0, 10);

const latest = (urls: readonly SitemapUrl[]) =>
  urls.reduce((max, url) => (url.lastmod > max ? url.lastmod : max), '');

/**
 * `/sitemap.xml`: one `landing-{n}.xml` per page of URLs, each with the
 * latest `lastmod` of its URLs. `/sitemaps/resources-{n}.xml` will join
 * them for resource pages.
 */
export function sitemapIndexXml(
  urls: readonly SitemapUrl[],
  origin: string,
): string {
  const files = Array.from({ length: sitemapPageCount(urls) }, (_, i) => {
    const lastmod = latest(sitemapPage(urls, i + 1));
    return [
      '  <sitemap>',
      `    <loc>${escapeXml(`${origin}/sitemaps/landing-${i + 1}.xml`)}</loc>`,
      ...(lastmod ? [`    <lastmod>${w3cDate(lastmod)}</lastmod>`] : []),
      '  </sitemap>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...files,
    '</sitemapindex>',
    '',
  ].join('\n');
}

/** A `landing-{n}.xml` file. */
export function urlsetXml(urls: readonly SitemapUrl[]): string {
  const body = urls.map((url) =>
    [
      '  <url>',
      `    <loc>${escapeXml(url.loc)}</loc>`,
      ...(url.lastmod
        ? [`    <lastmod>${w3cDate(url.lastmod)}</lastmod>`]
        : []),
      ...Object.entries(url.alternates).map(
        ([hreflang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
      ),
      '  </url>',
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...body,
    '</urlset>',
    '',
  ].join('\n');
}
