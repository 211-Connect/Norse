/**
 * Landing-page data as the CMS bridge returns it (docs/landing-pages.md).
 * View models for the public app, not Payload documents.
 */

export type LandingRegionType = 'state' | 'county' | 'place';

export type LandingRegion = {
  /** `state:WA`, `county:53053`, `place:5370000`. */
  id: string;
  type: LandingRegionType;
  /** As the regions index stores it: `Pierce County, WA`, `Tacoma`. */
  name: string;
  /** Postal code. */
  state: string;
  /** Places only: the county containing the place's centroid. */
  countyId?: string | null;
};

export type LandingSearch = {
  queryType: 'taxonomy' | 'text';
  /** Comma-separated taxonomy codes, or the query text. */
  query: string;
};

/** Copy written for a topic or a page, in one locale; empty fields inherit. */
export type LandingCopy = {
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  intro?: string | null;
};

export type LandingLink = {
  /** Path without locale prefix: `food-pantries/tacoma-wa`. */
  path: string;
  region: LandingRegion;
};

export type LandingPageView = {
  id: string;
  topic: {
    id: string;
    /** In the requested locale. */
    name: string;
    search: LandingSearch;
    copy: LandingCopy;
  };
  region: LandingRegion;
  /** The page's current path in this locale. */
  path: string;
  /** Current path per locale, for hreflang. */
  alternates: Record<string, string>;
  /** State page, then county page, when they exist and are live. */
  parents: LandingLink[];
  /** State page → its counties; county page → its cities. Live only. */
  children: LandingLink[];
};

export type LandingResolution =
  | { kind: 'page'; page: LandingPageView }
  | { kind: 'redirect'; path: string }
  | { kind: 'gone' }
  | { kind: 'not-found' };

/** One live page with its current path in every locale, for sitemaps. */
export type LandingSitemapEntry = {
  id: string;
  topicId: string;
  region: LandingRegion;
  /** Locale → current path. */
  paths: Record<string, string>;
  /** ISO date of the last slug or copy change. */
  lastModified: string;
};

export type LandingSitemap = {
  /** Topic id → localized name, for grouping the HTML sitemap. */
  topics: Record<string, Record<string, string>>;
  entries: LandingSitemapEntry[];
};
