/**
 * Slugs for SEO landing pages (docs/landing-pages.md). Pure functions, shared
 * by the CMS (generation, validation) and the public app (routing).
 *
 * A page's path is `{topicSlug}/{placeSlug}`. Topic slugs are translated per
 * locale; place slugs are not (place names are proper nouns).
 */

import { locales } from '@/payload/i18n/locales';

/** A topic slug equal to a locale code would read as a locale prefix. */
const LOCALE_SLUGS: ReadonlySet<string> = new Set(
  locales.map((locale) => locale.toLowerCase()),
);

/** Lower-case ASCII words joined by single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_SLUG_LENGTH = 80;

/**
 * First path segments a topic slug may never take: every folder under
 * `src/app/(app)/[locale]/(rest)` and `src/app/(app)/[locale]` (a static
 * route wins over the landing-page route, so a topic with one of these
 * slugs would never be reached), plus names Next.js or the proxy serve.
 * `tests/landing-pages-slugs.test.ts` fails when a route folder is missing.
 */
export const RESERVED_TOPIC_SLUGS: ReadonlySet<string> = new Set([
  'api',
  'auth',
  'details',
  'directories',
  'favorites',
  'legal',
  'search',
  'share',
  'sitemap',
  'sitemaps',
  'topics',
  'admin',
  'robots',
  'favicon',
  'manifest',
  'opengraph-image',
  'twitter-image',
  '_next',
]);

/**
 * Lower-case ASCII slug: accents dropped (`alimentación` → `alimentacion`),
 * apostrophes removed (`Coeur d'Alene` → `coeur-dalene`), every other run of
 * non-alphanumerics a single hyphen. Text in a non-Latin script gives `''`.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}

/** Why a topic slug is invalid, or null when it is valid. */
export function topicSlugProblem(slug: string): string | null {
  if (!slug) return 'A slug is required.';
  if (slug.length > MAX_SLUG_LENGTH) {
    return `Use at most ${MAX_SLUG_LENGTH} characters.`;
  }
  if (!SLUG_PATTERN.test(slug)) {
    return 'Use lower-case letters a–z, digits and single hyphens only.';
  }
  if (RESERVED_TOPIC_SLUGS.has(slug) || LOCALE_SLUGS.has(slug)) {
    return `"${slug}" is used by another page of the site; choose another slug.`;
  }
  return null;
}

/**
 * The topic slug for a locale: the slugified translated name, or the
 * default locale's slug when the translation has no Latin letters (Chinese,
 * Arabic, Russian…) or is reserved.
 */
export function topicSlugFor(name: string, fallbackSlug: string): string {
  const slug = slugify(name);
  return slug && !topicSlugProblem(slug) ? slug : fallbackSlug;
}

export type PlaceRegion = {
  id: string;
  type: 'state' | 'county' | 'place';
  /** As the regions index stores it: `Pierce County, WA`, `Tacoma`, `Washington`. */
  name: string;
  /** Postal code, `WA`. */
  state: string;
};

/** Full state names by postal code, for state page slugs and names. */
export const STATE_NAMES: Readonly<Record<string, string>> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

/** `Pierce County, WA` → `Pierce County`; other names unchanged. */
export function bareRegionName(name: string): string {
  return name.replace(/,\s*[A-Z]{2}$/, '').trim();
}

/**
 * The untranslated place part of a path: `washington`,
 * `pierce-county-wa`, `tacoma-wa`. A county whose name has no "County"
 * (Louisiana parishes, Alaska boroughs) keeps its own word:
 * `orleans-parish-la`.
 */
export function placeSlug(region: PlaceRegion): string {
  const st = region.state.toLowerCase();
  if (region.type === 'state') {
    return slugify(STATE_NAMES[region.state] ?? region.name);
  }
  return `${slugify(bareRegionName(region.name))}-${st}`;
}

/**
 * Place slugs for a state's regions, unique within the state: on a clash
 * (two places with one name), the later ones (by id) get their county's
 * name added, then their id.
 */
export function uniquePlaceSlugs(
  regions: readonly (PlaceRegion & { countyName?: string })[],
): Map<string, string> {
  const result = new Map<string, string>();
  const taken = new Set<string>();
  const sorted = [...regions].sort((a, b) => a.id.localeCompare(b.id));
  for (const region of sorted) {
    let slug = placeSlug(region);
    if (taken.has(slug) && region.countyName) {
      const county = slugify(bareRegionName(region.countyName));
      slug = slug.replace(
        new RegExp(`-${region.state.toLowerCase()}$`),
        `-${county}-${region.state.toLowerCase()}`,
      );
    }
    if (taken.has(slug)) slug = `${slug}-${region.id.split(':')[1]}`;
    taken.add(slug);
    result.set(region.id, slug);
  }
  return result;
}

export function landingPath(topicSlug: string, placeSlugValue: string): string {
  return `${topicSlug}/${placeSlugValue}`;
}

/** The URL path for a locale: no prefix on the tenant's default locale. */
export function localizedLandingHref(
  path: string,
  locale: string,
  defaultLocale: string,
): string {
  return locale === defaultLocale ? `/${path}` : `/${locale}/${path}`;
}
