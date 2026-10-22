import type {
  AiClassificationScenario,
  AiPredictOption,
} from '@/app/(app)/shared/services/ai-classification-search-service';
import type { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';
import { getSortOption } from '@/app/(app)/shared/utils/getSortOption';

import type { Slot } from './slot';
import type { SearchIntent } from './slots';

const valueOf = <T>(slot: Slot<T>): T | undefined =>
  slot.stated ? slot.value : undefined;

/** Empty counts as stated in the intent; the old shape drops it. */
const nonEmpty = (slot: Slot<string>) => valueOf(slot) || undefined;

/**
 * The intent in the shape the search service and the deep-link gate take. This is where the readings that the intent
 * deliberately does not make live: empty is absent, "Everywhere" is no location, age 0 is no age, and
 * sort falls back to relevance (and to relevance from distance without valid coords).
 */
export function toFindResourcesQuery(intent: SearchIntent): FindResourcesQuery {
  const coordinates = valueOf(intent.coords);
  const location = nonEmpty(intent.location);
  const taxonomy = valueOf(intent.taxonomy);
  return {
    query: nonEmpty(intent.query),
    queryLabel: nonEmpty(intent.queryLabel),
    queryType: nonEmpty(intent.queryType),
    organizationId: nonEmpty(intent.organizationId),
    location: isEverywhereLocation(location) ? undefined : location,
    coordinates,
    distance: nonEmpty(intent.distance),
    taxonomy: taxonomy?.length ? taxonomy : undefined,
    filters: valueOf(intent.filters) as FindResourcesQuery['filters'],
    sort: getSortOption(valueOf(intent.sort) ?? null, coordinates),
    age: valueOf(intent.age) || undefined,
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
