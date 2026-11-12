import type { MetadataRoute } from 'next';

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

/**
 * The `&amp;` crawl trap (ISS-2307, `src/lib/crawl-trap.ts`): a query key starting with `amp;`, after `?` or
 * after a separator `&`. A value never matches: a real `&` or `;` inside a value is percent-encoded. The edge
 * answers these with 410 anyway; this keeps polite crawlers from asking. AdsBot ignores `User-agent: *`.
 */
const CRAWL_TRAP_DISALLOW = ['/*?amp;', '/*&amp;', '/*?AMP;', '/*&AMP;'];

/** robots.txt for a host search engines may index. */
export function indexableRobotsRules(): MetadataRoute.Robots {
  return {
    rules: [
      ...DISALLOWED_CRAWLERS.map((userAgent) => ({ userAgent, disallow: '/' })),
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', ...CRAWL_TRAP_DISALLOW],
        crawlDelay: 10,
      },
    ],
  };
}
