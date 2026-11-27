import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { getSitemapUrls } from '@/app/(app)/features/landing-pages/server/sitemaps';
import { getTenantByHost } from '@/lib/cms/tenants';
import { createLogger } from '@/lib/logger';

import { indexableRobotsRules } from './robotsRules';

const log = createLogger('robots');

/** `https://host/sitemap.xml` when the host serves a sitemap. */
async function sitemapUrl(): Promise<string | undefined> {
  try {
    const sitemap = await getSitemapUrls();
    return sitemap ? `${sitemap.origin}/sitemap.xml` : undefined;
  } catch (err) {
    log.warn({ err }, 'Sitemap lookup failed; robots.txt names no sitemap');
    return undefined;
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Resolve the branded tenant for this request host so de-indexing can be
  // controlled per tenant. `robots.txt` is excluded from the middleware
  // matcher, so we look the tenant up directly here.
  const headersList = await headers();
  const host = parseHost(headersList.get('host') ?? '');

  let tenantNoindex = false;
  try {
    const tenant = await getTenantByHost(host);
    tenantNoindex = tenant?.seo?.noindex ?? false;
  } catch {
    // On lookup failure, fall back to the global env gate only.
  }

  // Block all search engines when the global gate blocks indexing (non-prod /
  // not opted in) or this specific tenant has opted out.
  if (shouldBlockCrawlers(tenantNoindex)) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  const sitemap = await sitemapUrl();
  return { ...indexableRobotsRules(), ...(sitemap && { sitemap }) };
}
