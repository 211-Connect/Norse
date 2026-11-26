import { type CopyTexts, type RegionStrings, fromI18nTags } from './copy';

/**
 * The built-in landing-page strings (`public/locales/<locale>/landing-pages.json`):
 * region name patterns and the default copy. Shared by the page and the CMS
 * previews (docs/landing-pages.md, "Page copy").
 */

/** English: the language templates are written in. */
const DEFAULT_LOCALE = 'en';

/** Labels around a page's results, i18next `{{location}}` filled by the page. */
export type LandingPageStrings = {
  home: string;
  /** The breadcrumb `nav`'s accessible name. */
  breadcrumbs: string;
  counties: string;
  cities: string;
  /** Heading over the links to other areas. */
  otherAreas: string;
  /** Heading over a topic hub's links to its areas. */
  byRegion: string;
  states: string;
  otherStates: string;
  otherCounties: string;
  otherCities: string;
};

const PAGE_FALLBACK: LandingPageStrings = {
  home: 'Home',
  breadcrumbs: 'Breadcrumb',
  counties: 'Counties in {{location}}',
  cities: 'Cities in {{location}}',
  otherAreas: 'Search for services in other regions',
  byRegion: 'Search for services by region',
  states: 'States',
  otherStates: 'Other states',
  otherCounties: 'Other counties in {{location}}',
  otherCities: 'Other cities in {{location}}',
};

type LandingStrings = {
  region?: Partial<RegionStrings>;
  defaults?: CopyTexts;
  page?: Partial<LandingPageStrings>;
};

async function readStrings(locale: string): Promise<LandingStrings> {
  try {
    return (await import(`@/../public/locales/${locale}/landing-pages.json`))
      .default as LandingStrings;
  } catch {
    return {};
  }
}

/**
 * The locale's region patterns, default copy and page labels, English where
 * missing.
 */
export async function loadLandingStrings(locale: string) {
  const [own, fallback] = await Promise.all([
    readStrings(locale),
    readStrings(DEFAULT_LOCALE),
  ]);
  const region: RegionStrings = {
    county: own.region?.county || fallback.region?.county || '{{name}} County',
    place: own.region?.place || fallback.region?.place || '{{name}}, {{state}}',
  };
  const texts = { ...fallback.defaults };
  for (const [key, value] of Object.entries(own.defaults ?? {})) {
    if (value) texts[key as keyof CopyTexts] = value;
  }
  const defaults = Object.fromEntries(
    Object.entries(texts).map(([key, value]) => [
      key,
      value ? fromI18nTags(value) : value,
    ]),
  ) as CopyTexts;
  const page = { ...PAGE_FALLBACK };
  for (const source of [fallback.page, own.page]) {
    for (const [key, value] of Object.entries(source ?? {})) {
      if (value) page[key as keyof LandingPageStrings] = value;
    }
  }
  return { region, defaults, page };
}
