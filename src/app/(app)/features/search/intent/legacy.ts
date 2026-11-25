import type {
  AiClassificationScenario,
  AiPredictOption,
} from '@/app/(app)/shared/services/ai-classification-search-service';
import type { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import {
  isEverywhereLocation,
  isTaxonomySearch,
} from '@/app/(app)/shared/lib/search-utils';
import { getSortOption } from '@/app/(app)/shared/utils/getSortOption';
import { isRegionId } from '@/types/areaSearch';

import type { Slot } from './slot';
import type { SearchIntent } from './slots';

const valueOf = <T>(slot: Slot<T>): T | undefined =>
  slot.stated ? slot.value : undefined;

/** Empty counts as stated in the intent; the old shape drops it. */
const nonEmpty = (slot: Slot<string>) => valueOf(slot) || undefined;

/**
 * The intent in the shape the search service and the deep-link gate take. This is where the readings that the intent
 * deliberately does not make live: empty is absent, "Everywhere" is no location, a malformed region is no
 * region, age 0 is no age, and
 * sort falls back to relevance, or to distance for a located taxonomy search (and to relevance from distance without
 * valid coords).
 *
 * The v2 URL slots (`needs`, `passed_needs`, `urgency`, `other`) reach the query only when `v2` is true, which
 * is the host tenant's `enableV2Api`. A v1 tenant's `/search` ignores them (Lucas, 2026-11-23, adversarial-review
 * finding 2 on PR #1222): a v2 link opened on a v1 host must not change a v1 search.
 */
export function toFindResourcesQuery(
  intent: SearchIntent,
  { v2 = false }: { v2?: boolean } = {},
): FindResourcesQuery {
  const coordinates = valueOf(intent.coords);
  const location = nonEmpty(intent.location);
  const region = nonEmpty(intent.region)?.trim();
  const taxonomy = valueOf(intent.taxonomy);
  const query = nonEmpty(intent.query);
  const queryType = nonEmpty(intent.queryType);
  return {
    query,
    queryLabel: nonEmpty(intent.queryLabel),
    queryType,
    organizationId: nonEmpty(intent.organizationId),
    location: isEverywhereLocation(location) ? undefined : location,
    coordinates,
    region: isRegionId(region) ? region : undefined,
    distance: nonEmpty(intent.distance),
    taxonomy: taxonomy?.length ? taxonomy : undefined,
    filters: valueOf(intent.filters) as FindResourcesQuery['filters'],
    sort: getSortOption(
      valueOf(intent.sort) ?? null,
      coordinates,
      isTaxonomySearch(queryType, query),
    ),
    age: valueOf(intent.age) || undefined,
    // v2 prototype (round 17): these change the results, so they reach the search call.
    ...(v2 ? v2Slots(intent) : {}),
  };
}

/** The v2 slots that change the results (round 17). */
function v2Slots(
  intent: SearchIntent,
): Pick<FindResourcesQuery, 'needs' | 'passedNeeds' | 'urgency' | 'other'> {
  return {
    needs: valueOf(intent.needs)?.length ? valueOf(intent.needs) : undefined,
    passedNeeds: valueOf(intent.passedNeeds)?.length
      ? valueOf(intent.passedNeeds)
      : undefined,
    urgency: valueOf(intent.urgency),
    other: nonEmpty(intent.other),
  };
}

/** The clarify step a URL carries, as the page and the dialog read it. */
export type LegacyAiClarifyState = {
  autoOpenDialog: boolean;
  scenario?: AiClassificationScenario;
  options: AiPredictOption[];
  selectedCodes: string[];
};

/** The clarify state the URL carries, or null when it carries none. */
export function toLegacyAiClarifyState(
  intent: SearchIntent,
): LegacyAiClarifyState | null {
  const scenario = valueOf(intent.aiScenario);
  const options = valueOf(intent.aiOptions) ?? [];
  if (!scenario && options.length === 0) return null;
  return {
    autoOpenDialog: Boolean(scenario),
    options,
    scenario,
    selectedCodes: options.filter((o) => o.pre_selected).map((o) => o.code),
  };
}
