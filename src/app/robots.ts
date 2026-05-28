import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Block all search engines in production unless explicitly allowed
  const isProduction = process.env.NODE_ENV === 'production';
  const allowSearchEngines =
    process.env.NEXT_PUBLIC_ALLOW_SEARCH_ENGINES === 'true';
  const shouldBlockCrawlers = isProduction && !allowSearchEngines;

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
