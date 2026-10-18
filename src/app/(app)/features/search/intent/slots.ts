import qs, { type ParsedQs } from 'qs';

import type {
  AiClassificationScenario,
  AiPredictOption,
} from '@/app/(app)/shared/services/ai-classification-search-service';
import {
  isSortOption,
  type SortOption,
} from '@/app/(app)/shared/utils/getSortOption';
import { parseBoolean, parseNumberOrNull } from '@/utils';
import { normalizeIndexedCollection } from '@/utils/normalizeIndexedCollection';

import {
  defineSlots,
  stringParam,
  type IntentOf,
  type SlotDeclaration,
} from './slot';

/** Whatever `qs` made of `filters[...]`: normally `{ key: string[] }`, but the URL decides. */
export type FiltersValue = Exclude<ParsedQs[string], undefined>;

/** Where a slug route's place points, before the page resolves it against the place catalog. */
export type PlaceReference =
  | { readonly kind: 'slug'; readonly slug: string }
  | { readonly kind: 'region'; readonly regionId: string };

export type GeoMode =
  | {
      readonly kind: 'radius';
      readonly coordinates: number[];
      readonly distance?: string;
    }
  | { readonly kind: 'boundary'; readonly place: PlaceReference };

const AI_SCENARIOS: ReadonlySet<string> = new Set<AiClassificationScenario>([
  'search',
  'clarify_low_info',
  'clarify_multiple_labels',
  'search_and_notify_low_info',
  'search_and_notify_low_confidence',
]);

const coords: SlotDeclaration<number[]> = {
  keys: ['coords'],
  decode: ({ parsed }) =>
    typeof parsed.coords === 'string' && parsed.coords
      ? parsed.coords
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : undefined,
  // `coords=abc` reads as no numbers, which is stated (it suppresses the geocode redirect). An empty
  // value would read as unstated and `,` as [0, 0], so the empty list is written as a non-number.
  encode: (value) => [['coords', value.join(',').trim() || 'invalid']],
};

const taxonomy: SlotDeclaration<string[]> = {
  keys: ['taxonomy'],
  // Read from the raw parameters, not through qs: `taxonomy=a&taxonomy=b` is two lists of codes.
  decode: ({ raw }) => {
    const value = raw.taxonomy;
    if (value === undefined) return undefined;
    const codes = (Array.isArray(value) ? value : [value])
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    return [...new Set(codes)];
  },
  encode: (value) => [['taxonomy', value.join(',')]],
};

const filters: SlotDeclaration<FiltersValue> = {
  keys: ['filters'],
  decode: ({ parsed }) => parsed.filters,
  // Through qs, so any shape qs read comes back as the same shape.
  encode: (value) => [...new URLSearchParams(qs.stringify({ filters: value }))],
};

const sort: SlotDeclaration<SortOption> = {
  keys: ['sort'],
  decode: ({ parsed }) => (isSortOption(parsed.sort) ? parsed.sort : undefined),
  encode: (value) => [['sort', value]],
};

const age: SlotDeclaration<number> = {
  keys: ['age'],
  decode: ({ parsed }) => {
    if (typeof parsed.age !== 'string' || !parsed.age) return undefined;
    const value = parseInt(parsed.age, 10);
    return isNaN(value) ? undefined : value;
  },
  encode: (value) => [['age', String(value)]],
};

const aiScenario: SlotDeclaration<AiClassificationScenario> = {
  keys: ['ai_scenario'],
  decode: ({ parsed }) =>
    typeof parsed.ai_scenario === 'string' &&
    AI_SCENARIOS.has(parsed.ai_scenario)
      ? (parsed.ai_scenario as AiClassificationScenario)
      : undefined,
  encode: (value) => [['ai_scenario', value]],
};

type RawAiOption = Partial<Record<keyof AiPredictOption, unknown>>;

const aiOptions: SlotDeclaration<AiPredictOption[]> = {
  keys: ['ai_options'],
  decode: ({ parsed }) => {
    const options = normalizeIndexedCollection<RawAiOption>(parsed.ai_options)
      .map((option) => {
        const code =
          typeof option.code === 'string' ? option.code.trim() : undefined;
        if (!code) return null;
        return {
          code,
          pre_selected: parseBoolean(option.pre_selected),
          results_count: parseNumberOrNull(option.results_count),
          score: parseNumberOrNull(option.score) ?? 0,
        } satisfies AiPredictOption;
      })
      .filter((option): option is AiPredictOption => option !== null);
    return options.length ? options : undefined;
  },
  encode: (value) =>
    value.flatMap((option, index): Array<[string, string]> => [
      [`ai_options[${index}][code]`, option.code],
      [`ai_options[${index}][score]`, String(option.score)],
      [`ai_options[${index}][pre_selected]`, option.pre_selected ? '1' : '0'],
      ...(typeof option.results_count === 'number' &&
      Number.isFinite(option.results_count)
        ? [
            [
              `ai_options[${index}][results_count]`,
              String(option.results_count),
            ] as [string, string],
          ]
        : []),
    ]),
};

// Reserved for the slug route (ISS-2296). A /search URL never states them.
// Reserved for the slug route (ISS-2296), which lifts them from the path. Never in a /search URL.
const place: SlotDeclaration<PlaceReference> = {
  keys: [],
  decode: () => undefined,
  encode: () => [],
};
const geoMode: SlotDeclaration<GeoMode> = {
  keys: [],
  decode: () => undefined,
  encode: () => [],
};

/**
 * Every slot of the search intent, in serializer order: the order `buildSearchUrl` has always written
 * them in. Add a slot here, with its URL keys, decoder and encoder, and it exists everywhere; old URLs
 * lift with it unstated.
 */
export const SEARCH_SLOTS = defineSlots({
  query: stringParam('query'),
  queryLabel: stringParam('query_label'),
  queryType: stringParam('query_type'),
  organizationId: stringParam('organization_id'),
  taxonomy,
  aiScenario,
  aiOptions,
  location: stringParam('location'),
  coords,
  distance: stringParam('distance'),
  filters,
  sort,
  age,
  place,
  geoMode,
});

export type SearchIntent = IntentOf<typeof SEARCH_SLOTS>;
