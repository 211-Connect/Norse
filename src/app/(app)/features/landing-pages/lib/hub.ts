/**
 * A topic's hub (`/food-pantries`, docs/landing-pages.md, "Topic hub"): the
 * topic's pages in a locale, top level first. Pure.
 */
import type { LandingLink, LandingRegionType, LandingSitemap } from './types';

const LEVELS: LandingRegionType[] = ['state', 'county', 'place'];

export type HubPage = LandingLink;

/**
 * The live pages under `topicSlug` in `locale` at the highest level the
 * tenant has (states, else counties, else cities), the topic's id, and the
 * topic's slug in every locale it has (for hreflang).
 */
export function hubPages(
  sitemap: LandingSitemap,
  topicSlug: string,
  locale: string,
): {
  topicId: string;
  pages: HubPage[];
  /** Every live page of the topic in `locale`, whatever its level. */
  all: HubPage[];
  alternates: Record<string, string>;
} | null {
  const prefix = `${topicSlug}/`;
  const under = sitemap.entries.filter((entry) =>
    entry.paths[locale]?.startsWith(prefix),
  );
  if (under.length === 0) return null;
  const { topicId } = under[0];
  // A topic has one slug per locale, so any of its pages gives them all.
  const alternates = Object.fromEntries(
    Object.entries(under[0].paths).map(([l, path]) => [l, path.split('/')[0]]),
  );
  const all = under.map((entry) => ({
    path: entry.paths[locale],
    region: entry.region,
  }));
  for (const level of LEVELS) {
    const pages = all.filter((page) => page.region.type === level);
    if (pages.length > 0) return { topicId, pages, all, alternates };
  }
  return null;
}
