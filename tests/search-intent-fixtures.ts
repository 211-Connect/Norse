// Readable fixtures for the search intent: one per URL generation, one per lift rule, and one per real-traffic
// shape ISS-2379 decided to preserve. Shared by the permanent tests (tests/search-intent.test.ts) and, until
// ISS-2377, the cut-over differential, which checks every fixture against today's parsers.
import type { SearchEngine } from '../src/types/appConfig';
import {
  SEARCH_SLOTS,
  type Generation,
  type LiftedSearch,
  type SearchIntent,
} from '../src/app/(app)/features/search/intent';

export const UNSTATED = { stated: false } as const;
const stated = <T>(value: T) => ({ stated: true, value }) as const;

/** The whole intent: the slots named here are stated, every other slot is unstated. */
export function intentWith(
  slots: Partial<Record<keyof SearchIntent, unknown>>,
) {
  return Object.fromEntries(
    Object.keys(SEARCH_SLOTS).map((name) => [
      name,
      name in slots ? stated(slots[name as keyof SearchIntent]) : UNSTATED,
    ]),
  );
}

export type Fixture = {
  name: string;
  query: string;
  /** What the serializer writes for the lifted URL: slot order, unreadable keys gone, nothing normalised. */
  canonical: string;
  /** Why the canonical URL does not lift back to the same intent. Only for losses listed on ISS-2374. */
  loses?: string;
  expected: Omit<LiftedSearch, 'intent'> & {
    intent: Partial<Record<keyof SearchIntent, unknown>>;
  };
};

const COORDS = [-122.3, 47.6];

/**
 * One real URL per generation: the most-viewed corpus URL (ISS-2370, values made synthetic), or for
 * canonical AI and clarify, which Umami truncated, what the legacy gate writes.
 */
export const GENERATION_FIXTURES: Record<Generation, Fixture> = {
  classic_text: {
    name: 'classic text with a located radius',
    query:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=0',
    canonical:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=0',
    expected: {
      generation: 'classic_text',
      modifiers: ['distance', 'coords'],
      intent: {
        query: 'syntheticquery text',
        queryLabel: 'syntheticlabel text',
        queryType: 'text',
        location: 'syntheticplace text,',
        coords: COORDS,
        distance: '0',
      },
      envelope: { passThrough: [] },
    },
  },
  taxonomy_card: {
    name: 'topic card with several codes, on page 2',
    query:
      'query=BH-3800.7200%2CBH-3800.7000%2CBH-3800.7250%2CFT-4500%2CBH-3700.8500%2CBH-3700.3200%2CBH-3900&query_label=syntheticlabel%20text&query_type=taxonomy&page=2',
    canonical:
      'query=BH-3800.7200%2CBH-3800.7000%2CBH-3800.7250%2CFT-4500%2CBH-3700.8500%2CBH-3700.3200%2CBH-3900&query_label=syntheticlabel+text&query_type=taxonomy&page=2',
    expected: {
      generation: 'taxonomy_card',
      modifiers: ['page'],
      intent: {
        // The codes stay one query string: taxonomy normalisation is the serializer's (ISS-2374).
        query:
          'BH-3800.7200,BH-3800.7000,BH-3800.7250,FT-4500,BH-3700.8500,BH-3700.3200,BH-3900',
        queryLabel: 'syntheticlabel text',
        queryType: 'taxonomy',
      },
      envelope: { page: '2', passThrough: [] },
    },
  },
  hybrid_no_taxonomy: {
    name: 'legacy hybrid link with no taxonomy',
    query:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=hybrid&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=25',
    canonical:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=hybrid&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=25',
    expected: {
      generation: 'hybrid_no_taxonomy',
      modifiers: ['distance', 'coords'],
      intent: {
        query: 'syntheticquery text',
        queryLabel: 'syntheticlabel text',
        queryType: 'hybrid',
        location: 'syntheticplace text,',
        coords: COORDS,
        distance: '25',
      },
      envelope: { passThrough: [] },
    },
  },
  canonical_ai: {
    name: 'canonical AI link written by the legacy gate',
    query:
      'query=syntheticquery&query_type=hybrid&taxonomy=BD-1800.2000&sllc=1',
    canonical:
      'query=syntheticquery&query_type=hybrid&taxonomy=BD-1800.2000&sllc=1',
    expected: {
      generation: 'canonical_ai',
      modifiers: [],
      intent: {
        query: 'syntheticquery',
        queryType: 'hybrid',
        taxonomy: ['BD-1800.2000'],
      },
      envelope: { sllc: '1', passThrough: [] },
    },
  },
  ai_notify: {
    name: 'AI notify with a low-information alert',
    query:
      'query=syntheticquery&query_label=syntheticlabel&query_type=hybrid&a=low_info&location=syntheticplace+text%2C&coords=-122.3%2C47.6&sllc=1',
    canonical:
      'query=syntheticquery&query_label=syntheticlabel&query_type=hybrid&a=low_info&location=syntheticplace+text%2C&coords=-122.3%2C47.6&sllc=1',
    expected: {
      generation: 'ai_notify',
      modifiers: ['coords'],
      intent: {
        query: 'syntheticquery',
        queryLabel: 'syntheticlabel',
        queryType: 'hybrid',
        location: 'syntheticplace text,',
        coords: COORDS,
      },
      envelope: { sllc: '1', a: 'low_info', passThrough: [] },
    },
  },
  clarify: {
    name: 'clarify with two v1 need options, one pre-selected',
    query:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=hybrid&ai_scenario=clarify_multiple_labels&ai_options%5B0%5D%5Bcode%5D=BD-1800.2000&ai_options%5B0%5D%5Bscore%5D=0.91&ai_options%5B0%5D%5Bpre_selected%5D=1&ai_options%5B0%5D%5Bresults_count%5D=12&ai_options%5B1%5D%5Bcode%5D=BH-1800.8500&ai_options%5B1%5D%5Bscore%5D=0.62&ai_options%5B1%5D%5Bpre_selected%5D=0&ai_options%5B1%5D%5Bresults_count%5D=3&sllc=1',
    canonical:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=hybrid&ai_scenario=clarify_multiple_labels&ai_options%5B0%5D%5Bcode%5D=BD-1800.2000&ai_options%5B0%5D%5Bscore%5D=0.91&ai_options%5B0%5D%5Bpre_selected%5D=1&ai_options%5B0%5D%5Bresults_count%5D=12&ai_options%5B1%5D%5Bcode%5D=BH-1800.8500&ai_options%5B1%5D%5Bscore%5D=0.62&ai_options%5B1%5D%5Bpre_selected%5D=0&ai_options%5B1%5D%5Bresults_count%5D=3&sllc=1',
    expected: {
      generation: 'clarify',
      modifiers: [],
      intent: {
        query: 'syntheticquery text',
        queryLabel: 'syntheticlabel text',
        queryType: 'hybrid',
        aiScenario: 'clarify_multiple_labels',
        aiOptions: [
          {
            code: 'BD-1800.2000',
            pre_selected: true,
            results_count: 12,
            score: 0.91,
          },
          {
            code: 'BH-1800.8500',
            pre_selected: false,
            results_count: 3,
            score: 0.62,
          },
        ],
      },
      envelope: { sllc: '1', passThrough: [] },
    },
  },
  organization_link: {
    name: 'organization link with a label and a radius',
    query:
      'query_label=syntheticlabel+text&query_type=text&organization_id=89ac10c5-4d83-56ab-90db-586d3a8188ae&distance=20',
    canonical:
      'query_label=syntheticlabel+text&query_type=text&organization_id=89ac10c5-4d83-56ab-90db-586d3a8188ae&distance=20',
    expected: {
      generation: 'organization_link',
      modifiers: ['organization_id', 'distance'],
      intent: {
        queryLabel: 'syntheticlabel text',
        queryType: 'text',
        organizationId: '89ac10c5-4d83-56ab-90db-586d3a8188ae',
        distance: '20',
      },
      envelope: { passThrough: [] },
    },
  },
  no_query: {
    name: 'located browse with the retired entry marker',
    query:
      'query_type=text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=25&entry=search_card',
    canonical:
      'query_type=text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=25&entry=search_card',
    expected: {
      generation: 'no_query',
      modifiers: ['distance', 'coords'],
      intent: {
        queryType: 'text',
        location: 'syntheticplace text,',
        coords: COORDS,
        distance: '25',
      },
      envelope: { entry: 'search_card', passThrough: [] },
    },
  },
};

/** The lift's rules, each on the smallest URL that shows it. */
export const RULE_FIXTURES: Fixture[] = [
  {
    name: 'bare /search: every slot unstated',
    query: '',
    canonical: '',
    expected: {
      generation: 'no_query',
      modifiers: [],
      intent: {},
      envelope: { passThrough: [] },
    },
  },
  {
    name: 'empty and Everywhere are stated, not unknown',
    query: 'query=&location=Everywhere',
    canonical: 'query=&location=Everywhere',
    expected: {
      generation: 'no_query',
      modifiers: [],
      intent: { query: '', location: 'Everywhere' },
      envelope: { passThrough: [] },
    },
  },
  {
    name: 'an unrecognised query_type is kept but read as classic text',
    query: 'query=syntheticquery+text&query_type=query&query_language=en',
    canonical: 'query=syntheticquery+text&query_type=query&query_language=en',
    expected: {
      generation: 'classic_text',
      modifiers: [],
      intent: { query: 'syntheticquery text', queryType: 'query' },
      envelope: { passThrough: [['query_language', 'en']] },
    },
  },
  {
    name: 'taxonomy codes with no query and no AI query_type are no query',
    query: 'taxonomy=BD-1800.2000',
    canonical: 'taxonomy=BD-1800.2000',
    expected: {
      generation: 'no_query',
      modifiers: [],
      intent: { taxonomy: ['BD-1800.2000'] },
      envelope: { passThrough: [] },
    },
  },
  {
    name: 'unrecognised parameters pass through in order, untouched',
    query: 'utm_source=synthetic&query=syntheticquery&hl=es&gad_source=1',
    canonical: 'query=syntheticquery&utm_source=synthetic&hl=es&gad_source=1',
    expected: {
      generation: 'classic_text',
      modifiers: [],
      intent: { query: 'syntheticquery' },
      envelope: {
        passThrough: [
          ['utm_source', 'synthetic'],
          ['hl', 'es'],
          ['gad_source', '1'],
        ],
      },
    },
  },
  {
    name: 'several taxonomy codes are one comma-separated parameter',
    query:
      'query=syntheticquery&query_type=hybrid&taxonomy=BD-1800.2000%2CBH-1800.8500&sllc=1',
    canonical:
      'query=syntheticquery&query_type=hybrid&taxonomy=BD-1800.2000%2CBH-1800.8500&sllc=1',
    expected: {
      generation: 'canonical_ai',
      modifiers: [],
      intent: {
        query: 'syntheticquery',
        queryType: 'hybrid',
        taxonomy: ['BD-1800.2000', 'BH-1800.8500'],
      },
      envelope: { sllc: '1', passThrough: [] },
    },
  },
  {
    name: 'filters (an & inside a key), sort and age are written back as read',
    query:
      'query=syntheticquery&filters%5Bage_group%5D%5B0%5D=syntheticvalue&filters%5Bdisabilities_%26_health_conditions%5D%5B0%5D=syntheticvalue+a&filters%5Bdisabilities_%26_health_conditions%5D%5B1%5D=syntheticvalue+b&sort=name&age=40',
    canonical:
      'query=syntheticquery&filters%5Bage_group%5D%5B0%5D=syntheticvalue&filters%5Bdisabilities_%26_health_conditions%5D%5B0%5D=syntheticvalue+a&filters%5Bdisabilities_%26_health_conditions%5D%5B1%5D=syntheticvalue+b&sort=name&age=40',
    expected: {
      generation: 'classic_text',
      modifiers: ['filters', 'sort', 'age'],
      intent: {
        query: 'syntheticquery',
        filters: {
          age_group: ['syntheticvalue'],
          'disabilities_&_health_conditions': [
            'syntheticvalue a',
            'syntheticvalue b',
          ],
        },
        sort: 'name',
        age: 40,
      },
      envelope: { passThrough: [] },
    },
  },
];

/** Builds a fixture's expected lift: no modifiers and no markers unless given. */
function shape(
  name: string,
  query: string,
  canonical: string,
  generation: Generation,
  intent: Fixture['expected']['intent'],
  extra: Partial<Omit<Fixture['expected'], 'intent' | 'generation'>> = {},
): Fixture {
  return {
    name,
    query,
    canonical,
    expected: {
      generation,
      modifiers: [],
      intent,
      envelope: { passThrough: [] },
      ...extra,
    },
  };
}

/**
 * Real-traffic shapes ISS-2379 decided to preserve (2026-10-18), each pinned to today's reading. Several
 * read badly on purpose: fixing them changes URL behaviour, so the fixes are their own tickets after the
 * cut-over (linked from each sub-issue).
 */
export const SHAPE_FIXTURES: Fixture[] = [
  shape(
    'ISS-2307 &amp; cascade: prefixed keys pass through, the query is lost',
    'syntheticparamb=&amp;page=2&amp;query=syntheticquery%20text&page=2',
    'page=2&syntheticparamb=&amp%3Bpage=2&amp%3Bquery=syntheticquery+text',
    'no_query',
    {},
    {
      modifiers: ['page'],
      envelope: {
        page: '2',
        passThrough: [
          ['syntheticparamb', ''],
          ['amp;page', '2'],
          ['amp;query', 'syntheticquery text'],
        ],
      },
    },
  ),
  shape(
    'ISS-2381 label split by an unescaped &: the tail becomes a key',
    'query=syntheticquery&query_label=syntheticlabel%20&%20text&query_type=taxonomy',
    'query=syntheticquery&query_label=syntheticlabel+&query_type=taxonomy&+text=',
    'taxonomy_card',
    {
      query: 'syntheticquery',
      queryLabel: 'syntheticlabel ',
      queryType: 'taxonomy',
    },
    { envelope: { passThrough: [[' text', '']] } },
  ),
  shape(
    'ISS-2381 double-encoded value stays encoded once',
    'query=syntheticquery%2520text',
    'query=syntheticquery%2520text',
    'classic_text',
    { query: 'syntheticquery%20text' },
  ),
  shape(
    'ISS-2382 repeated location is unstated; coords and distance are kept',
    'query=RP&query_type=taxonomy&location=&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=5&query_label=syntheticlabel+text',
    'query=RP&query_label=syntheticlabel+text&query_type=taxonomy&coords=-122.3%2C47.6&distance=5',
    'taxonomy_card',
    {
      query: 'RP',
      queryLabel: 'syntheticlabel text',
      queryType: 'taxonomy',
      coords: COORDS,
      distance: '5',
    },
    { modifiers: ['distance', 'coords'] },
  ),
  shape(
    'ISS-2382 repeated query_type is unstated, so a topic code reads as classic text',
    'query=BH-3800.7250&query_type=taxonomy&query_type=taxonomy',
    'query=BH-3800.7250',
    'classic_text',
    { query: 'BH-3800.7250' },
  ),
  shape(
    'ISS-2383 distance with no location or coords is stated',
    'distance=25',
    'distance=25',
    'no_query',
    { distance: '25' },
    { modifiers: ['distance'] },
  ),
  shape(
    'ISS-2384 empty query_type on a topic code is stated empty and reads as classic text',
    'query=PH-1250.8000&query_label=syntheticlabel+text&query_type=',
    'query=PH-1250.8000&query_label=syntheticlabel+text&query_type=',
    'classic_text',
    {
      query: 'PH-1250.8000',
      queryLabel: 'syntheticlabel text',
      queryType: '',
    },
  ),
  shape(
    'ISS-2384 legacy query_type keyword is kept and read as classic text',
    'query=syntheticquery&query_type=keyword',
    'query=syntheticquery&query_type=keyword',
    'classic_text',
    { query: 'syntheticquery', queryType: 'keyword' },
  ),
  shape(
    'ISS-2384 query_type "taxonomy " with a trailing space is not taxonomy',
    'query=PN-8100.4500-120&query_type=taxonomy%20',
    'query=PN-8100.4500-120&query_type=taxonomy+',
    'classic_text',
    { query: 'PN-8100.4500-120', queryType: 'taxonomy ' },
  ),
  shape(
    'ISS-2384 bracketed query_type and location are unstated',
    'query=BH-3800.7250&query_type%5B0%5D=taxonomy&location%5B0%5D=syntheticplace',
    'query=BH-3800.7250',
    'classic_text',
    { query: 'BH-3800.7250' },
  ),
  shape(
    'ISS-2384 the gate on a topic code: taxonomy query_type with a and sllc is AI notify',
    'query=RP-1500.1400-240&query_type=taxonomy&a=low_info&sllc=1',
    'query=RP-1500.1400-240&query_type=taxonomy&a=low_info&sllc=1',
    'ai_notify',
    { query: 'RP-1500.1400-240', queryType: 'taxonomy' },
    { envelope: { sllc: '1', a: 'low_info', passThrough: [] } },
  ),
  shape(
    'ISS-2385 free text in a taxonomy query is still a topic card',
    'query=syntheticquery&query_type=taxonomy',
    'query=syntheticquery&query_type=taxonomy',
    'taxonomy_card',
    { query: 'syntheticquery', queryType: 'taxonomy' },
  ),
  shape(
    'ISS-2385 bare family code, with sort=distance stated though there are no coords',
    'query=YD&query_label=syntheticlabel&query_type=taxonomy&sort=distance',
    'query=YD&query_label=syntheticlabel&query_type=taxonomy&sort=distance',
    'taxonomy_card',
    {
      query: 'YD',
      queryLabel: 'syntheticlabel',
      queryType: 'taxonomy',
      sort: 'distance',
    },
    { modifiers: ['sort'] },
  ),
  shape(
    'ISS-2386 foreign parameters (hl, q, terms) pass through',
    'query=FF-1850&query_type=taxonomy&hl=en-US&q=synthetic&terms=synthetic',
    'query=FF-1850&query_type=taxonomy&hl=en-US&q=synthetic&terms=synthetic',
    'taxonomy_card',
    { query: 'FF-1850', queryType: 'taxonomy' },
    {
      envelope: {
        passThrough: [
          ['hl', 'en-US'],
          ['q', 'synthetic'],
          ['terms', 'synthetic'],
        ],
      },
    },
  ),
  shape(
    'ISS-2386 bracketed utm keys pass through under their own names',
    'query=BH-7000.4600&query_type=taxonomy&utm_source%5B0%5D=synthetic&utm_source%5B1%5D=synthetic',
    'query=BH-7000.4600&query_type=taxonomy&utm_source%5B0%5D=synthetic&utm_source%5B1%5D=synthetic',
    'taxonomy_card',
    { query: 'BH-7000.4600', queryType: 'taxonomy' },
    {
      envelope: {
        passThrough: [
          ['utm_source[0]', 'synthetic'],
          ['utm_source[1]', 'synthetic'],
        ],
      },
    },
  ),
  shape(
    'ISS-2388 edge whitespace in the query is kept',
    'query=%20syntheticquery%20',
    'query=+syntheticquery+',
    'classic_text',
    { query: ' syntheticquery ' },
  ),
  shape(
    'ISS-2388 empty location is stated empty',
    'location=',
    'location=',
    'no_query',
    {
      location: '',
    },
  ),
  shape(
    'ISS-2388 non-numeric distance is kept as written',
    'query=syntheticquery+text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=Any',
    'query=syntheticquery+text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=Any',
    'classic_text',
    {
      query: 'syntheticquery text',
      location: 'syntheticplace text,',
      coords: COORDS,
      distance: 'Any',
    },
    { modifiers: ['distance', 'coords'] },
  ),
  shape(
    'ISS-2388 a page that is not a number stays in the envelope',
    'page=syntheticpage',
    'page=syntheticpage',
    'no_query',
    {},
    {
      modifiers: ['page'],
      envelope: { page: 'syntheticpage', passThrough: [] },
    },
  ),
  shape('ISS-2388 empty sort is unstated', 'sort=', '', 'no_query', {}),
  shape(
    'ISS-2388 Everywhere with coords: both stated',
    'location=Everywhere&coords=-122.3%2C47.6',
    'location=Everywhere&coords=-122.3%2C47.6',
    'no_query',
    { location: 'Everywhere', coords: COORDS },
    { modifiers: ['coords'] },
  ),
  shape(
    'ISS-2388 coords that are not numbers are an empty list, not unstated',
    'location=syntheticplace&coords=abc',
    'location=syntheticplace&coords=invalid',
    'no_query',
    { location: 'syntheticplace', coords: [] },
    { modifiers: ['coords'] },
  ),
];

/**
 * URLs the serializer cannot write back losslessly, each listed on ISS-2374. The filters slot holds what qs
 * parsed, and qs reads an unbalanced bracket as a key it cannot write again (revisit with ISS-2376).
 */
export const LOSSY_FIXTURES: Fixture[] = [
  {
    ...shape(
      'ISS-2374 unbalanced bracket in a filter key: qs cannot write it back',
      'query_type=text&filters%5Bpayment%5D%5B0%5D%5BElderly%20Waiver%20%28EW%29&page=343',
      'query_type=text&filters%5Bpayment%5D%5B0%5D%5B%5BElderly+Waiver+%28EW%29%5D=&page=343',
      'no_query',
      {
        queryType: 'text',
        filters: { payment: [{ '[Elderly Waiver (EW)': '' }] },
      },
      {
        modifiers: ['filters', 'page'],
        envelope: { page: '343', passThrough: [] },
      },
    ),
    loses: 'the filter key comes back as "[[Elderly Waiver (EW)]"',
  },
];

export const ALL_FIXTURES = [
  ...Object.values(GENERATION_FIXTURES),
  ...RULE_FIXTURES,
  ...SHAPE_FIXTURES,
  ...LOSSY_FIXTURES,
];

export type WriterFixture = {
  name: string;
  query: string;
  searchEngine: SearchEngine;
  /** What a writer writes for the lifted URL, after the writer rules. */
  written: string;
};

/** The writer rules, each on the smallest URL that shows it. */
export const WRITER_FIXTURES: WriterFixture[] = [
  {
    name: 'query_type: a stated hybrid becomes what the engine searches with',
    query: 'query=syntheticquery&query_type=hybrid',
    searchEngine: 'classic',
    written: '/search?query=syntheticquery&query_type=text',
  },
  {
    name: 'query_type: a query of codes is taxonomy on any engine',
    query: 'query=BD-1800.2000',
    searchEngine: 'ai_classification',
    written: '/search?query=BD-1800.2000&query_type=taxonomy',
  },
  {
    name: 'query_type: always written, hybrid on an AI engine',
    query: 'query=syntheticquery',
    searchEngine: 'ai_classification',
    written: '/search?query=syntheticquery&query_type=hybrid',
  },
  {
    name: 'query, label and organization are trimmed',
    query:
      'query=%20syntheticquery%20&query_label=%20syntheticlabel%20&organization_id=%20synthetic-org%20',
    searchEngine: 'classic',
    written:
      '/search?query=syntheticquery&query_label=syntheticlabel&query_type=text&organization_id=synthetic-org',
  },
  {
    name: 'empty values are dropped',
    query: 'query=&query_label=&organization_id=&location=',
    searchEngine: 'classic',
    written: '/search?query_type=text',
  },
  {
    name: 'Everywhere is no location, and so no distance',
    query: 'query=syntheticquery&location=Everywhere&distance=25',
    searchEngine: 'classic',
    written: '/search?query=syntheticquery&query_type=text',
  },
  {
    name: 'distance with no location or coords is dropped',
    query: 'distance=25',
    searchEngine: 'classic',
    written: '/search?query_type=text',
  },
  {
    name: 'distance with coords is kept, trimmed',
    query: 'coords=-122.3%2C47.6&distance=%2025%20',
    searchEngine: 'classic',
    written: '/search?query_type=text&coords=-122.3%2C47.6&distance=25',
  },
  {
    name: 'coords are written only as a pair',
    query: 'location=syntheticplace&coords=1%2C2%2C3&distance=5',
    searchEngine: 'classic',
    written: '/search?query_type=text&location=syntheticplace&distance=5',
  },
  {
    name: 'taxonomy codes are trimmed, de-duplicated and empty ones dropped',
    query: 'taxonomy=%20BD-1800.2000%2C%2CBD-1800.2000%2CBH-1800',
    searchEngine: 'classic',
    written: '/search?query_type=text&taxonomy=BD-1800.2000%2CBH-1800',
  },
  {
    name: 'a new search starts on the first page',
    query: 'query=syntheticquery&page=3',
    searchEngine: 'classic',
    written: '/search?query=syntheticquery&query_type=text',
  },
  {
    name: 'markers, sort and pass-through parameters are kept, in serializer order',
    query:
      'utm_source=synthetic&query=syntheticquery&a=low_info&sllc=1&sort=name&entry=search_card',
    searchEngine: 'hybrid',
    written:
      '/search?query=syntheticquery&query_type=hybrid&a=low_info&sort=name&sllc=1&entry=search_card&utm_source=synthetic',
  },
];
