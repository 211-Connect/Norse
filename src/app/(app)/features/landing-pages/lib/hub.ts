/**
 * A topic's hub URL (`/food-pantries`, docs/landing-pages.md, "URLs"): the
 * topic's top-level pages in a locale. Pure.
 */
import type { LandingRegionType, LandingSitemap } from './types';

const LEVELS: LandingRegionType[] = ['state', 'county', 'place'];

export type HubPage = {
  path: string;
  region: { name: string; type: LandingRegionType; state: string };
};

/**
 * The live pages under `topicSlug` in `locale` at the highest level the
 * tenant has (states, else counties, else cities), and the topic's id.
 */
export function hubPages(
  sitemap: LandingSitemap,
  topicSlug: string,
  locale: string,
): { topicId: string; pages: HubPage[] } | null {
  const prefix = `${topicSlug}/`;
  const under = sitemap.entries.filter((entry) =>
    entry.paths[locale]?.startsWith(prefix),
  );
  if (under.length === 0) return null;
  for (const level of LEVELS) {
    const pages = under
      .filter((entry) => entry.region.type === level)
      .map((entry) => ({ path: entry.paths[locale], region: entry.region }));
    if (pages.length > 0) return { topicId: under[0].topicId, pages };
  }
  return null;
}
