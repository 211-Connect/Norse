import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getNorseRole, servesPath } from '@/lib/norse-role';
import { type AppConfig } from '@/types/appConfig';

import { type SitemapUrl, landingSitemapUrls } from '../lib/xmlSitemap';
import { getLandingSitemap } from './landing-data';
import { landingOrigin, servesLandingPages } from './landing-page-data';

/**
 * Whether the host serves sitemaps: it serves landing pages and search
 * engines may index it (the deployment allows them and the tenant is not
 * `noindex`).
 */
export function servesSitemaps(appConfig: AppConfig): boolean {
  return (
    servesLandingPages(appConfig) &&
    !shouldBlockCrawlers(appConfig.noindex ?? false)
  );
}

/**
 * The request host's sitemap URLs and origin, or null when it serves no
 * sitemap. `/sitemap.xml` and `/sitemaps/*` skip the proxy (like
 * `robots.txt`), so the role is checked here. The page list is cached under
 * the tenant's landing-pages version (`getLandingSitemap`); the XML is built
 * from it per request.
 */
export async function getSitemapUrls(): Promise<{
  origin: string;
  urls: SitemapUrl[];
} | null> {
  if (!servesPath(getNorseRole(), '/sitemap.xml')) return null;
  // Any locale reads the tenant's flags; the paths carry their own.
  const appConfig = await getAppConfigWithoutHost('en');
  if (!servesSitemaps(appConfig)) return null;
  const [sitemap, origin] = await Promise.all([
    getLandingSitemap(appConfig.tenantId),
    landingOrigin(appConfig),
  ]);
  const urls = landingSitemapUrls(sitemap, {
    origin,
    defaultLocale: appConfig.i18n.defaultLocale,
  });
  return urls.length > 0 ? { origin, urls } : null;
}

export const SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  // Edits reach the version within a minute; crawlers read sitemaps rarely.
  'Cache-Control': 'public, max-age=600',
};
