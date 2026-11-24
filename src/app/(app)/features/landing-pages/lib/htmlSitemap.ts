/**
 * The HTML sitemap (`/sitemap`, docs/landing-pages.md, "Sitemaps"): a
 * locale's live landing pages grouped by topic, then state, with counties
 * A–Z and each county's cities under it. Pure.
 */
import { type RegionStrings, regionDisplayName } from './copy';
import { STATE_NAMES } from './slugs';
import type { LandingRegion, LandingSitemap } from './types';

/** Past this many links in a locale, `/sitemap` lists topics and each topic gets `/sitemap/{topic-slug}`. */
export const HTML_SITEMAP_LINK_LIMIT = 2000;

/** `path` has no locale prefix. */
export type SitemapLink = { label: string; path: string };

export type SitemapCounty = {
  label: string;
  /** Absent when the county has no live page but some of its cities do. */
  path?: string;
  cities: SitemapLink[];
};

export type SitemapState = {
  label: string;
  /** Absent when the state has no live page. */
  path?: string;
  counties: SitemapCounty[];
};

export type SitemapTopic = {
  id: string;
  name: string;
  /** The topic's slug in this locale. */
  slug: string;
  /** Links under the topic. */
  count: number;
  states: SitemapState[];
};

const byLabel =
  (locale: string) =>
  <T extends { label: string }>(a: T, b: T) =>
    a.label.localeCompare(b.label, locale);

/** The topics with live pages in `locale`, A–Z, each as its page tree. */
export function htmlSitemapTopics(
  sitemap: LandingSitemap,
  {
    locale,
    defaultLocale,
    regionStrings,
  }: { locale: string; defaultLocale: string; regionStrings: RegionStrings },
): SitemapTopic[] {
  const stateName = (code: string) => STATE_NAMES[code] ?? code;
  const label = (region: LandingRegion) =>
    regionDisplayName(region, regionStrings, stateName(region.state));
  const sort = byLabel(locale);

  const byTopic = new Map<string, typeof sitemap.entries>();
  for (const entry of sitemap.entries) {
    if (!entry.paths[locale]) continue;
    byTopic.set(entry.topicId, [...(byTopic.get(entry.topicId) ?? []), entry]);
  }

  const topics = [...byTopic].map(([id, entries]): SitemapTopic => {
    const states = new Map<string, SitemapState>();
    const counties = new Map<string, SitemapCounty>();
    const stateOf = (code: string) => {
      let state = states.get(code);
      if (!state) {
        state = { label: stateName(code), counties: [] };
        states.set(code, state);
      }
      return state;
    };
    const countyOf = (id: string, code: string, fallback: string) => {
      let county = counties.get(id);
      if (!county) {
        county = { label: fallback, cities: [] };
        counties.set(id, county);
        stateOf(code).counties.push(county);
      }
      return county;
    };

    for (const entry of entries) {
      const { region } = entry;
      const path = entry.paths[locale];
      if (region.type === 'state') {
        stateOf(region.state).path = path;
      } else if (region.type === 'county') {
        const county = countyOf(region.id, region.state, label(region));
        county.label = label(region);
        county.path = path;
      } else {
        // A city whose county has no page sits under its county's name
        // when known, else in a group of its own at the end.
        const countyId = region.countyId ?? `none:${region.state}`;
        countyOf(countyId, region.state, '').cities.push({
          label: label(region),
          path,
        });
      }
    }

    for (const state of states.values()) {
      for (const county of state.counties) county.cities.sort(sort);
      state.counties.sort((a, b) =>
        !a.label ? 1 : !b.label ? -1 : sort(a, b),
      );
    }

    const names = sitemap.topics[id] ?? {};
    return {
      id,
      name: names[locale] || names[defaultLocale] || '',
      slug: entries[0].paths[locale].split('/')[0],
      count: entries.length,
      states: [...states.values()].sort(sort),
    };
  });

  return topics.sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Whether `/sitemap` lists topics only, each on its own page. */
export function splitsByTopic(topics: readonly SitemapTopic[]): boolean {
  return (
    topics.reduce((sum, topic) => sum + topic.count, 0) >
    HTML_SITEMAP_LINK_LIMIT
  );
}

/** The topic's slug in every locale it has live pages in. */
export function topicSlugsByLocale(
  sitemap: LandingSitemap,
  topicId: string,
): Record<string, string> {
  const slugs: Record<string, string> = {};
  for (const entry of sitemap.entries) {
    if (entry.topicId !== topicId) continue;
    for (const [locale, path] of Object.entries(entry.paths)) {
      slugs[locale] ??= path.split('/')[0];
    }
  }
  return slugs;
}

/** Locales with at least one live page. */
export function sitemapLocales(sitemap: LandingSitemap): string[] {
  return [
    ...new Set(sitemap.entries.flatMap((entry) => Object.keys(entry.paths))),
  ].sort();
}
