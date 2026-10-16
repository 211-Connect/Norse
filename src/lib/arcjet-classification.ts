import {
  type ArcjetBotCategory,
  type ArcjetWellKnownBot,
  categories as ARCJET_CATEGORIES,
} from '@arcjet/protocol/well-known-bots';

/**
 * ISS-2366: classify an Arcjet denial for the `bot_blocked` analytics event.
 *
 * The rules are documented as a table in docs/architecture.md ("Blocked
 * traffic analytics"); keep the two in sync. The category map is the SDK's
 * own (`categories` from `@arcjet/protocol`), so a bot's classification
 * follows the SDK version in package.json rather than a hand-kept list.
 *
 * Edge-safe: pure functions over a frozen object, no Node imports.
 */

export type BlockedTrafficClassification = 'seo' | 'nefarious' | 'unknown';

/** Categories whose members are SEO / marketing crawlers. */
export const SEO_CATEGORIES: ReadonlySet<string> = new Set([
  'CATEGORY:ADVERTISING',
  'CATEGORY:OPTIMIZER',
]);

/**
 * SEO vendors the category map files under CATEGORY:UNKNOWN (or no
 * category at all), named here so they count as `seo` rather than
 * `unknown`. A vendor that is ALSO in a nefarious category (e.g.
 * BOTIFY_CRAWLER is in CATEGORY:AI) still classifies as `nefarious`,
 * because severity wins — see `classifyBot`.
 */
export const SEO_VENDOR_BOTS: ReadonlySet<string> = new Set([
  'SEMRUSH_CRAWLER',
  'AHREFS_CRAWLER',
  'AHREFS_SITE_AUDIT',
  'MOZ_CRAWLER',
  'DATAFORSEO_CRAWLER',
  'MAJESTIC_CRAWLER',
  'BRIGHTEDGE_CRAWLER',
  'BOTIFY_CRAWLER',
]);

/** Categories whose members are scrapers, tooling, botnets or AI crawlers. */
export const NEFARIOUS_CATEGORIES: ReadonlySet<string> = new Set([
  'CATEGORY:PROGRAMMATIC',
  'CATEGORY:TOOL',
  'CATEGORY:BOTNET',
  'CATEGORY:AI',
  'CATEGORY:ARCHIVE',
  'CATEGORY:ACADEMIC',
]);

/** Bot labels that are nefarious regardless of category. */
export const NEFARIOUS_BOT_PREFIXES = ['HEADLESS_'] as const;
export const NEFARIOUS_BOTS: ReadonlySet<string> = new Set(['UNKNOWN_BOT']);

/** Higher wins when a bot carries several signals. */
const SEVERITY: Record<BlockedTrafficClassification, number> = {
  nefarious: 2,
  seo: 1,
  unknown: 0,
};

export type CategoryMap = Readonly<Record<string, readonly string[]>>;

/** `bot → [categories]`, inverted once per category map. */
const botCategoryCache = new WeakMap<CategoryMap, Map<string, string[]>>();

function botCategories(bot: string, categoryMap: CategoryMap): string[] {
  let index = botCategoryCache.get(categoryMap);
  if (!index) {
    index = new Map();
    for (const [category, bots] of Object.entries(categoryMap)) {
      for (const member of bots) {
        const list = index.get(member);
        if (list) list.push(category);
        else index.set(member, [category]);
      }
    }
    botCategoryCache.set(categoryMap, index);
  }
  return index.get(bot) ?? [];
}

function classificationOfCategory(
  category: string,
): BlockedTrafficClassification {
  if (NEFARIOUS_CATEGORIES.has(category)) return 'nefarious';
  if (SEO_CATEGORIES.has(category)) return 'seo';
  return 'unknown';
}

function isNefariousByName(bot: string): boolean {
  if (NEFARIOUS_BOTS.has(bot)) return true;
  return NEFARIOUS_BOT_PREFIXES.some((prefix) => bot.startsWith(prefix));
}

export interface BotClassification {
  classification: BlockedTrafficClassification;
  /**
   * The Arcjet category that decided the classification, or the bot's first
   * category when none did; '' when the bot is in no category.
   */
  category: string;
}

/**
 * Classify one Arcjet bot label. A label that is itself a category
 * (`CATEGORY:...`) is classified directly. A bot in several categories takes
 * the most severe (nefarious > seo > unknown).
 */
export function classifyBot(
  bot: string,
  categoryMap: CategoryMap = ARCJET_CATEGORIES,
): BotClassification {
  if (bot.startsWith('CATEGORY:')) {
    return { classification: classificationOfCategory(bot), category: bot };
  }

  const cats = botCategories(bot, categoryMap);
  let best: BotClassification = {
    classification: 'unknown',
    category: cats[0] ?? '',
  };

  for (const category of cats) {
    const classification = classificationOfCategory(category);
    if (SEVERITY[classification] > SEVERITY[best.classification]) {
      best = { classification, category };
    }
  }

  if (best.classification !== 'nefarious' && isNefariousByName(bot)) {
    best = { classification: 'nefarious', category: best.category };
  }

  if (best.classification === 'unknown' && SEO_VENDOR_BOTS.has(bot)) {
    best = { classification: 'seo', category: best.category };
  }

  return best;
}

export interface BlockedTrafficDenial {
  /** Bot labels Arcjet denied; empty for a non-bot denial. */
  deniedBots: readonly string[];
  /** `decision.reason.type`, e.g. 'BOT' | 'FILTER' | 'RATE_LIMIT'. */
  reasonType: string;
}

export interface BlockedTrafficClassificationResult {
  classification: BlockedTrafficClassification;
  /** First denied bot name, or ''. */
  bot: string;
  /** Primary Arcjet category (see `BotClassification.category`), or ''. */
  category: string;
  /** Lower-cased reason type: 'bot' | 'filter' | ... */
  reason: string;
}

/**
 * Classify a whole denial. Any filter-rule denial is `nefarious` (the only
 * filter today denies requests with no User-Agent). For a bot denial the
 * most severe classification across all denied labels wins; `bot` is the
 * first denied label and `category` is the category of the label that
 * decided the classification.
 */
export function classifyBlockedTraffic(
  denial: BlockedTrafficDenial,
  categoryMap: CategoryMap = ARCJET_CATEGORIES,
): BlockedTrafficClassificationResult {
  const reason = (denial.reasonType || 'unknown').toLowerCase();
  const bot = denial.deniedBots[0] ?? '';

  if (reason === 'filter') {
    return { classification: 'nefarious', bot, category: '', reason };
  }

  let classification: BlockedTrafficClassification = 'unknown';
  let category = '';
  denial.deniedBots.forEach((label, index) => {
    const result = classifyBot(label, categoryMap);
    if (
      index === 0 ||
      SEVERITY[result.classification] > SEVERITY[classification]
    ) {
      classification = result.classification;
      category = result.category;
    }
  });

  return { classification, bot, category, reason };
}

export type { ArcjetBotCategory, ArcjetWellKnownBot };
export { ARCJET_CATEGORIES };
