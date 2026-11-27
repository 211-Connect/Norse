import { sitemapIndexXml } from '@/app/(app)/features/landing-pages/lib/xmlSitemap';
import {
  SITEMAP_HEADERS,
  getSitemapUrls,
} from '@/app/(app)/features/landing-pages/server/sitemaps';

export const dynamic = 'force-dynamic';

/** The host's sitemap index (docs/landing-pages.md, "Sitemaps"). */
export async function GET() {
  const sitemap = await getSitemapUrls();
  if (!sitemap) return new Response('Not found', { status: 404 });
  return new Response(sitemapIndexXml(sitemap.urls, sitemap.origin), {
    headers: SITEMAP_HEADERS,
  });
}
