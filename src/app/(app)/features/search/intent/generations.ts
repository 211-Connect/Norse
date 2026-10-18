import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';

import type { SearchEnvelope } from './envelope';
import type { Slot, Stated } from './slot';
import type { SearchIntent } from './slots';

/**
 * The shapes of search URL Norse has written over time. A URL is classified by its shape alone; no marker
 * is written into URLs. Each generation is a complete description, not a step in a first-match list, so
 * a URL matching none or two of them is detectable (and the classification test fails on it). When two
 * generations can no longer be told apart by shape, that is the time to add a marker.
 */
export const GENERATIONS = [
  'classic_text',
  'taxonomy_card',
  'hybrid_no_taxonomy',
  'canonical_ai',
  'ai_notify',
  'clarify',
  'organization_link',
  'no_query',
] as const;

export type Generation = (typeof GENERATIONS)[number];

/** Flags that appear on top of any generation. */
export type Modifier =
  | 'location_no_coords'
  | 'printable_directory'
  | 'filters'
  | 'organization_id'
  | 'sort'
  | 'page'
  | 'age'
  | 'distance'
  | 'coords';

type Shape = (intent: SearchIntent, envelope: SearchEnvelope) => boolean;

const text = (slot: Slot<string>): slot is Stated<string> =>
  slot.stated && slot.value.trim() !== '';
const queryType = (intent: SearchIntent) =>
  intent.queryType.stated ? intent.queryType.value : undefined;

const isClarify: Shape = (i) => i.aiScenario.stated || i.aiOptions.stated;
const isNotify: Shape = (_i, e) =>
  e.a === 'low_info' || e.a === 'low_confidence';
const hasQuery: Shape = (i) => text(i.query);
const hasTaxonomy: Shape = (i) =>
  i.taxonomy.stated && i.taxonomy.value.length > 0;
const isHybrid: Shape = (i) => queryType(i) === 'hybrid';
const isTaxonomyType: Shape = (i) => queryType(i) === 'taxonomy';
/** Neither clarify nor notify, and `query_type` is not one the AI flow or topic cards write. */
const plain: Shape = (i, e) =>
  !isClarify(i, e) &&
  !isNotify(i, e) &&
  !isHybrid(i, e) &&
  !isTaxonomyType(i, e);

const SHAPES: Record<Generation, Shape> = {
  clarify: (i, e) => isClarify(i, e),
  ai_notify: (i, e) => !isClarify(i, e) && isNotify(i, e),
  canonical_ai: (i, e) =>
    !isClarify(i, e) && !isNotify(i, e) && isHybrid(i, e) && hasTaxonomy(i, e),
  hybrid_no_taxonomy: (i, e) =>
    !isClarify(i, e) && !isNotify(i, e) && isHybrid(i, e) && !hasTaxonomy(i, e),
  taxonomy_card: (i, e) =>
    !isClarify(i, e) && !isNotify(i, e) && isTaxonomyType(i, e),
  // Any other `query_type` (absent, `text`, empty, legacy `keyword`, fuzzed) is ignored by every reader.
  classic_text: (i, e) => plain(i, e) && hasQuery(i, e),
  organization_link: (i, e) =>
    plain(i, e) && !hasQuery(i, e) && text(i.organizationId),
  // Taxonomy codes without a hybrid or taxonomy `query_type` are not a query of their own.
  no_query: (i, e) => plain(i, e) && !hasQuery(i, e) && !text(i.organizationId),
};

/** Every generation whose shape the URL matches. Exactly one, for every URL Norse has seen. */
export function matchGenerations(
  intent: SearchIntent,
  envelope: SearchEnvelope,
): Generation[] {
  return GENERATIONS.filter((g) => SHAPES[g](intent, envelope));
}

export function modifiersOf(
  intent: SearchIntent,
  envelope: SearchEnvelope,
): Modifier[] {
  const flags: Array<[Modifier, boolean]> = [
    [
      'location_no_coords',
      text(intent.location) &&
        !isEverywhereLocation(intent.location.value) &&
        !intent.coords.stated,
    ],
    [
      'printable_directory',
      envelope.pdid !== undefined || envelope.pdsid !== undefined,
    ],
    ['filters', intent.filters.stated],
    ['organization_id', intent.organizationId.stated],
    ['sort', intent.sort.stated],
    ['page', envelope.page !== undefined],
    ['age', intent.age.stated],
    ['distance', intent.distance.stated],
    ['coords', intent.coords.stated],
  ];
  return flags.filter(([, on]) => on).map(([m]) => m);
}
