import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

/**
 * Crawlers told to stay away entirely. A crawler that obeys robots.txt then
 * never requests a page, so it never costs an Arcjet decision. Arcjet still
 * denies the ones that ignore it (see `ARCJET_ALLOWED_BOTS` in
 * src/lib/arcjet/rules.ts); keep the two lists in agreement.
 */
const DISALLOWED_CRAWLERS = [
  // SEO and scraping crawlers.
  'SemrushBot',
  'MJ12bot',
  'Bytespider',
  'DotBot',
  'AhrefsBot',
  'TikTokSpider',
  'PetalBot',
  // AI training crawlers. Assistants fetching a page for a person
  // (ChatGPT-User, OAI-SearchBot, Perplexity-User, Claude-User) are not
  // listed: they are allowed, here and in Arcjet.
  'GPTBot',
  'CCBot',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'Applebot-Extended',
  'Meta-ExternalAgent',
];

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
      ...DISALLOWED_CRAWLERS.map((userAgent) => ({ userAgent, disallow: '/' })),
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
        crawlDelay: 10,
      },
    ],
  };
}
