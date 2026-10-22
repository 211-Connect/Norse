import { detectBot, filter } from '@arcjet/next';

/**
 * Bots allowed through `detectBot`. Evidence measured 2026-10-16 from prod
 * logs over ~4h. Arcjet denies a request when ANY of its labels is
 * unallowed, so a bot carrying two labels needs both named.
 */
export const ARCJET_ALLOWED_BOTS = [
  'CATEGORY:SEARCH_ENGINE',
  'CATEGORY:PREVIEW',
  'CATEGORY:MONITOR',
  // Verified Meta requests carry two labels: META_WEBINDEXER (allowed via
  // SEARCH_ENGINE) and FACEBOOK_CRAWLER. 2,389 denials in 2.5h.
  'FACEBOOK_CRAWLER',
  // State of Minnesota's accessibility scanner reaching MBOA via the mn.gov
  // proxy. 10,747 denials in 4h20m. CATEGORY:UNKNOWN, so it must be named.
  // Pending confirmation with MBOA (ISS-1737).
  'SITEIMPROVE_CRAWLER',
  // Non-US search engines, CATEGORY:UNKNOWN in Arcjet's taxonomy. MBOA
  // serves Hmong and Somali communities.
  'NAVER_CRAWLER',
  'BAIDU_CRAWLER',
  // PageSpeed Insights / Lighthouse. Only in CATEGORY:GOOGLE and
  // CATEGORY:OPTIMIZER, so it must be named. Needed for SEO baselines.
  'GOOGLE_LIGHTHOUSE',
  // AI assistants fetching a page for a person who asked them (e.g. "find a
  // food bank near me"), not crawling for training: ChatGPT-User,
  // OAI-SearchBot, Perplexity-User, Claude-User. All are CATEGORY:AI, which
  // is otherwise denied. Training crawlers stay denied and are disallowed in
  // robots.txt (src/app/robots.ts).
  'OPENAI_CRAWLER_USER',
  'OPENAI_CRAWLER_SEARCH',
  'PERPLEXITY_USER',
  'ANTHROPIC_CRAWLER_USER',
] as const;

/**
 * ISS-1744: a request with no User-Agent cannot be evaluated by the bot rule
 * and today ends as CONCLUSION_ERROR (fail-open). Arcjet support recommends
 * denying it outright. The filter rule runs in DRY_RUN until the dry-run
 * impact has been read after deploy; then switch its mode to LIVE.
 */
export const NO_USER_AGENT_FILTER =
  'len(http.request.headers["user-agent"]) eq 0' as const;

/** The rule set passed to `arcjet()`; exported so tests can inspect it. */
export function buildArcjetRules() {
  return [
    detectBot({
      mode: 'LIVE',
      allow: [...ARCJET_ALLOWED_BOTS],
    }),
    filter({
      mode: 'DRY_RUN',
      deny: [NO_USER_AGENT_FILTER],
    }),
  ];
}
