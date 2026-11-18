import { detectBot, filter, slidingWindow } from '@arcjet/next';

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
  // robots.txt (`DISALLOWED_CRAWLERS` in src/app/robotsRules.ts).
  'OPENAI_CRAWLER_USER',
  'OPENAI_CRAWLER_SEARCH',
  'PERPLEXITY_USER',
  'ANTHROPIC_CRAWLER_USER',
  // Advanced Signals (the browser script's `aj_signals` cookie). Allowed at
  // first so signal-based denials show up as `allowed_bots` in our records
  // without blocking anyone; remove once the data shows few false positives.
  'ARCJET_SIGNALS',
] as const;

/**
 * ISS-1744: a request with no User-Agent cannot be evaluated by the bot rule
 * and today ends as CONCLUSION_ERROR (fail-open). Arcjet support recommends
 * denying it outright. The filter rule runs in DRY_RUN until the dry-run
 * impact has been read after deploy; then switch its mode to LIVE.
 */
export const NO_USER_AGENT_FILTER =
  'len(http.request.headers["user-agent"]) eq 0' as const;

/**
 * A "browser" on a hosting network: a hosting/cloud IP that is not a known
 * crawler and not a relay (iCloud Private Relay), sending `sec-fetch-mode`,
 * which only real browsers (and tools imitating them) send. Rule recommended
 * by Arcjet support (2026-11-18): about a third of our traffic came from
 * hosting networks (AWS, Tencent, Google Cloud, Zillion AS54801, Huawei,
 * BytePlus, Zenlayer), ~123k requests a day claiming to be a browser; the
 * Zillion traffic carries complete, consistent browser headers, so only the
 * network gives it away.
 *
 * Would also block real people on VPNs or cloud desktops (a small share per
 * Arcjet) and any allowed bot that runs a real browser from a cloud IP
 * without being flagged a crawler (check `allowed_bots` on the dry-run
 * matches, e.g. GOOGLE_LIGHTHOUSE, OPENAI_CRAWLER_USER). DRY_RUN on every
 * route: read the `dry_run_matches` in `arcjet_decision` records before
 * promoting to LIVE.
 */
export const HOSTING_IP_FILTER =
  'ip.src.hosting and not ip.src.crawler and not ip.src.relay and len(http.request.headers["sec-fetch-mode"]) gt 0' as const;

/** Requests one client IP may make per minute (`ARCJET_RATE_LIMIT_PER_MINUTE`). */
export const ARCJET_DEFAULT_RATE_LIMIT_PER_MINUTE = 60;

/**
 * `ARCJET_RATE_LIMIT_PER_MINUTE` as a non-negative integer; `0` turns the
 * rate limit off. Anything else falls back to the default.
 */
export function parseRateLimitPerMinute(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return ARCJET_DEFAULT_RATE_LIMIT_PER_MINUTE;
  }
  const max = Number(value);
  return Number.isInteger(max) && max >= 0
    ? max
    : ARCJET_DEFAULT_RATE_LIMIT_PER_MINUTE;
}

/**
 * Per-IP rate limit: a sliding 60-second window per client IP (Arcjet's
 * default fingerprint, `ip.src`), counted by Arcjet's Decide API in the
 * same call as the bot check. LIVE: on an enforced host a client over the
 * limit gets the 403; on an observe-only host the denial is only logged and
 * counted. Once a client is limited, the SDK caches the denial locally for
 * the TTL Arcjet sets, so its next requests are denied without a call.
 * No exemption for allowed crawlers: they spread requests over many IPs.
 */
function rateLimitRules(maxPerMinute: number) {
  if (maxPerMinute <= 0) return [];
  return [slidingWindow({ mode: 'LIVE', interval: 60, max: maxPerMinute })];
}

/** The rule set passed to `arcjet()`; exported so tests can inspect it. */
export function buildArcjetRules(
  maxPerMinute: number = parseRateLimitPerMinute(
    process.env.ARCJET_RATE_LIMIT_PER_MINUTE,
  ),
) {
  return [
    ...rateLimitRules(maxPerMinute),
    detectBot({
      mode: 'LIVE',
      allow: [...ARCJET_ALLOWED_BOTS],
    }),
    filter({
      mode: 'DRY_RUN',
      deny: [NO_USER_AGENT_FILTER],
    }),
    filter({
      mode: 'DRY_RUN',
      deny: [HOSTING_IP_FILTER],
    }),
  ];
}

/**
 * Bots allowed on the print action: search engines and link previews only.
 * AI assistants and unknown bots are denied (a printable directory is a bulk
 * export). `ARCJET_SIGNALS` stays allowed while Advanced Signals is observed.
 */
export const PRINT_ALLOWED_BOTS = [
  'CATEGORY:SEARCH_ENGINE',
  'CATEGORY:PREVIEW',
  'ARCJET_SIGNALS',
] as const;

/** Custom characteristic for per-visitor limits: a hashed session id. */
export const VISITOR_CHARACTERISTIC = 'norse_visitor' as const;

/**
 * Print calls per visitor. IPs rotate, so the key is the hashed session
 * cookie (`norse_visitor`), not the IP. DRY_RUN until the dry-run matches
 * show where real use ends.
 */
export const PRINT_RATE_LIMIT = { interval: '10m', max: 20 } as const;

/** Rules added on top of the base rules for one route (`aj.withRule`). */
export function routeRules(route: string) {
  if (route !== 'print') return [];
  return [
    ...detectBot({
      mode: 'LIVE',
      allow: [...PRINT_ALLOWED_BOTS],
    }),
    ...slidingWindow({
      mode: 'DRY_RUN',
      interval: PRINT_RATE_LIMIT.interval,
      max: PRINT_RATE_LIMIT.max,
      characteristics: [VISITOR_CHARACTERISTIC],
    }),
  ];
}
