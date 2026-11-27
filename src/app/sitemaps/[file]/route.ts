import {
  landingSitemapNumber,
  sitemapPage,
  urlsetXml,
} from '@/app/(app)/features/landing-pages/lib/xmlSitemap';
import {
  SITEMAP_HEADERS,
  getSitemapUrls,
} from '@/app/(app)/features/landing-pages/server/sitemaps';

export const dynamic = 'force-dynamic';

/** `/sitemaps/landing-{n}.xml` (docs/landing-pages.md, "Sitemaps"). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const n = landingSitemapNumber((await params).file);
  const sitemap = n ? await getSitemapUrls() : null;
  const urls = sitemap && n ? sitemapPage(sitemap.urls, n) : [];
  if (urls.length === 0) return new Response('Not found', { status: 404 });
  return new Response(urlsetXml(urls), { headers: SITEMAP_HEADERS });
}
