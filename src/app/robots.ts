import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { findTenantByHost } from '@/payload/collections/Tenants/actions';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const hostHeader = headerList.get('host') || '';
  const host = hostHeader.split(':')[0];

  const tenant = host ? await findTenantByHost(host) : null;
  const shouldBlockCrawlers =
    tenant?.crawlerSettings?.allowSearchEngines === false;

  if (shouldBlockCrawlers) {
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
