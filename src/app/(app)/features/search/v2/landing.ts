/**
 * Prototype: the landing page that comes before the results page. No React here, so the unit
 * tests can import it. The page itself is `search-landing.tsx`; its questions are the guide's
 * (`SearchGuideFromUrl` with `placement="page"`).
 */
import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';
import type { SearchEngine } from '@/types/appConfig';

import {
  applyWriterRules,
  liftQueryString,
  serializeSearchUrl,
  UNSTATED,
} from '../intent';
import type { V2Changes } from './v2-contract';

/** The landing page route. The results page stays at its own route. */
export const LANDING_PATH = '/find';

/**
 * A link that already names its results. Taxonomy codes and an organization are not answers to
 * questions, so such a link never needs the landing page and goes straight to the results page.
 * A bare query, and needs that come with a query, stay on the landing page: they are what the landing page writes.
 */
export function isDirectResultsLink(
  params: Pick<URLSearchParams, 'get'>,
): boolean {
  const hasQuery = Boolean(
    params.get('query')?.trim() || params.get('searchTerm')?.trim(),
  );
  return Boolean(
    params.get('taxonomy')?.trim() ||
    params.get('organization_id')?.trim() ||
    // Needs with no typed text: an ad or SEO link. There is nothing to ask about.
    (!hasQuery && params.get('needs')?.trim()),
  );
}

/**
 * The results page URL for the landing page's current query string. The answers stay in the URL
 * as they are (`needs`, `passed_needs`, `urgency`, `asked`, location). `refine` goes,
 * because the landing page has done the asking. `sllc=1` stops the legacy link gate from
 * rewriting the URL and dropping the answers, as the guide's first step already does.
 */
export function resultsUrlFor(
  search: string,
  searchEngine: SearchEngine,
  basePath = '',
): string {
  const { intent, envelope } = liftQueryString(search);
  const written = applyWriterRules(
    { ...intent, refine: UNSTATED },
    { ...envelope, sllc: '1' },
    { searchEngine },
  );
  return serializeSearchUrl(written.intent, written.envelope, basePath);
}

/**
 * What the landing page shows for one state. Pure, so the flow can be tested:
 * - `box`: no query yet, only the search box.
 * - `loading`: a query, and the questions are not here yet.
 * - `question`: one question (the emergency question first).
 * - `location`: the location step.
 * - `results`: nothing left to ask, so the person goes to the results page.
 */
export type LandingStep =
  'box' | 'loading' | 'question' | 'location' | 'results';

export function landingStep(state: {
  query: string;
  hasData: boolean;
  showLocation: boolean;
  hasQuestion: boolean;
}): LandingStep {
  if (!state.query) return 'box';
  if (!state.hasData) return 'loading';
  if (state.showLocation) return 'location';
  if (state.hasQuestion) return 'question';
  return 'results';
}

/** The results page path, with or without a locale prefix: `/search`, `/en/search`, `/es/search/`. */
export function isResultsPath(pathname: string | null | undefined): boolean {
  return /^(\/[a-z]{2}(-[A-Za-z]{2})?)?\/search\/?$/.test(pathname ?? '');
}

/** The place text the landing page shows, or null when there is none (empty, or Everywhere). */
export function landingLocationLabel(
  location: string | null | undefined,
): string | null {
  const text = (location ?? '').trim();
  if (!text || isEverywhereLocation(text)) return null;
  return text;
}

/** The URL changes that clear the place. The search text and answers stay. */
export const CLEAR_LOCATION_CHANGES: V2Changes = {
  location: null,
  coords: null,
  region: null,
  area_match: null,
  distance: null,
};

/** The URL changes for a place the person picked. */
export function locationChanges(
  location: string,
  coords: number[] | string | null | undefined,
  region: string | null | undefined,
): V2Changes {
  const text = Array.isArray(coords) ? coords.join(',') : (coords ?? '');
  return { location, coords: text || null, region: region || null };
}

/**
 * A results URL, moved to the landing page with the same query string. For the home page's search
 * dialog, which hands a new search to the landing page instead of the results page.
 */
export function toLandingUrl(resultsUrl: string): string {
  const at = resultsUrl.indexOf('?');
  if (at === -1) return LANDING_PATH;
  // A typed search asks its questions: `refine=1`. A plain /find?query= URL shows results (SEO, shared links).
  const params = new URLSearchParams(resultsUrl.slice(at + 1));
  if (params.get('query')?.trim() && !params.has('refine')) {
    return `${LANDING_PATH}${resultsUrl.slice(at)}&refine=1`;
  }
  return `${LANDING_PATH}${resultsUrl.slice(at)}`;
}

/**
 * A place the location box committed: it has a point or an area. Typed letters (the box's decommit)
 * have neither, so they are not a pick (live walk 2026-11-20: the first letter closed the box).
 */
export function isPickedPlace(
  coords: number[] | string | null | undefined,
  region: string | null | undefined,
): boolean {
  const point = Array.isArray(coords) ? coords.length > 0 : Boolean(coords);
  return point || Boolean(region);
}

/** The place the /find place row showed when Change was tapped. */
export interface PlaceBeforeChange {
  location: string;
  coordinates: unknown[];
  region: string;
}

/**
 * Cancel on the /find place row: the search state with the place from before Change. Clearing the
 * box (x) or typing only edits the box; only a new pick replaces the place (Lucas, 2026-11-20).
 */
export function restorePlace<T extends object>(
  prev: T,
  before: PlaceBeforeChange,
): T {
  return {
    ...prev,
    searchLocation: before.location,
    prevSearchLocation: before.location,
    searchCoordinates: before.coordinates,
    searchRegion: before.region,
    searchLocationValidationError: '',
  };
}

/**
 * A click on any suggestion (a tenant suggestion, a topic, a taxonomy or an organization row) is a
 * finished search: the text fills the box and the results page opens with no questions (Lucas,
 * 2026-11-20, replaces the 2026-11-06 "pick only fills the box" rule). An organization row also
 * scopes the search to that organization, as the v1 bar does. The old answers go with the old text.
 */
export function suggestionPickChanges(option: {
  value: string;
  organizationId?: string;
}): V2Changes {
  return {
    query: option.value,
    query_label: null,
    asked: null,
    refine: null,
    needs: null,
    passed_needs: null,
    urgency: null,
    organization_id: option.organizationId || null,
  };
}
