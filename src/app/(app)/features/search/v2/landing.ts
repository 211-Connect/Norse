/**
 * Prototype: the landing page that comes before the results page. No React here, so the unit
 * tests can import it. The page itself is `search-landing.tsx`; its questions are the guide's
 * (`SearchGuideFromUrl` with `placement="page"`).
 */
import type { SearchEngine } from '@/types/appConfig';

import {
  applyWriterRules,
  liftQueryString,
  serializeSearchUrl,
  UNSTATED,
} from '../intent';

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
 * as they are (`needs`, `passed_needs`, `urgency`, `other`, `asked`, location). `refine` goes,
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

/**
 * A results URL, moved to the landing page with the same query string. For the home page's search
 * dialog, which hands a new search to the landing page instead of the results page.
 */
export function toLandingUrl(resultsUrl: string): string {
  const at = resultsUrl.indexOf('?');
  return `${LANDING_PATH}${at === -1 ? '' : resultsUrl.slice(at)}`;
}
