import {
  type RawSearchParams,
  toFindResourcesQuery,
} from '@/app/(app)/features/search/intent';
import { liftSearchRequest } from '@/app/(app)/features/search/utils/liftSearchRequest';
import { withAreaSettings } from '@/app/(app)/features/search/utils/withAreaSettings';
import { type FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import { type AppConfig } from '@/types/appConfig';
import { ONE_DAY } from '@/utilities/withCache';

import { regionDisplayName } from '../lib/copy';
import { landingBaseParams, landingSearchParams } from '../lib/search';
import { STATE_NAMES } from '../lib/slugs';
import { loadLandingStrings } from '../lib/strings';
import type { LandingRegion, LandingSearch } from '../lib/types';

/** Landing-page searches and pins stay in Redis this long; the warm-up job refreshes them nightly. */
export const LANDING_SEARCH_TTL = ONE_DAY;

/** What a page's search depends on. */
export type LandingSearchPage = {
  topic: { name: string; search: LandingSearch };
  /** None for a topic's hub (`/{topic}`): the topic across the tenant. */
  region: LandingRegion | null;
};

/**
 * The page's search (docs/landing-pages.md, "The page"): the one function
 * the landing route and the warm-up job both build it with, so the job
 * writes exactly the `search_results:…` and `search_pins:…` keys the page
 * reads.
 *
 * @param requestParams The page request's query string; only its
 *   refinements count. The job passes none.
 */
export async function landingSearch(
  appConfig: Pick<AppConfig, 'search'>,
  page: LandingSearchPage,
  locale: string,
  requestParams: RawSearchParams = {},
): Promise<{
  /** The place as the location field shows it; empty for a hub. */
  location: string;
  /** The fixed search as `/search` parameters. */
  base: [string, string][];
  intent: ReturnType<typeof liftSearchRequest>['intent'];
  query: FindResourcesQuery;
}> {
  const strings = await loadLandingStrings(locale);
  const { region } = page;
  const location = region
    ? regionDisplayName(
        region,
        strings.region,
        STATE_NAMES[region.state] ?? region.state,
      )
    : '';
  const base = landingBaseParams({
    search: page.topic.search,
    topicName: page.topic.name,
    regionId: region?.id ?? null,
    location: location || null,
    searchEngine: appConfig.search.searchEngine,
  });
  const { intent } = liftSearchRequest(
    landingSearchParams(base, requestParams),
  );
  return {
    location,
    base,
    intent,
    query: withAreaSettings(toFindResourcesQuery(intent), appConfig),
  };
}
