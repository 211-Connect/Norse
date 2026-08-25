import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Resolve the branded tenant for this request host so de-indexing can be
  // controlled per tenant. `robots.txt` is excluded from the middleware
  // matcher, so we look the tenant up directly here.
  const headersList = await headers();
  const host = parseHost(headersList.get('host') ?? '');

  let tenantNoindex = false;
  try {
    const tenant = await findTenantByHost(host);
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

  return {
    rules: [
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'TikTokSpider',
        disallow: '/',
      },
      {
        userAgent: 'PetalBot',
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
        crawlDelay: 10,
      },
    ],
  };
}
