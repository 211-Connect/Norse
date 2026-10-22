import { assign, setup } from 'xstate';

import {
  toFindResourcesQuery,
  toLegacyAiClarifyState,
  type SearchIntent,
} from '@/app/(app)/features/search/intent';
import { buildSearchUrl } from '@/app/(app)/features/search/utils/buildSearchUrl';
import type { LegacyAiClarifyState } from '@/app/(app)/features/search/utils/parseLegacyAiClarifyParams';
import type { AiPredictResponse } from '@/app/(app)/shared/services/ai-classification-search-service';
import type { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import type { SearchEngine } from '@/types/appConfig';

import type { SearchPolicy } from './policy';

/**
 * What the page does in a state. Every state the machine can rest in carries exactly one of these as a
 * tag; `tests/search-resolver.test.ts` walks every state node to keep it that way.
 */
export const PAGE_ACTIONS = [
  'page:render-results',
  'page:render-gate',
  'page:redirect',
] as const;
export type PageAction = (typeof PAGE_ACTIONS)[number];

/** The scenarios that search straight away; every other scenario asks the user to clarify. */
const DIRECT_SCENARIOS: ReadonlyArray<AiPredictResponse['scenario'] | null> = [
  'search',
  'search_and_notify_low_confidence',
  'search_and_notify_low_info',
];

/** The clarify options of a prediction, as the gate has always read them. */
const optionsOf = (prediction: AiPredictResponse | null) =>
  Array.isArray(prediction?.options) ? prediction.options : [];

export type ResolverInput = {
  intent: SearchIntent;
  /** `sllc=1`: the URL was written by the resolver, so it is not resolved again. */
  loopGuard: boolean;
  policy: SearchPolicy;
  searchEngine: SearchEngine;
};

export type ResolverContext = ResolverInput & {
  /** The intent in the shape the search service and `buildSearchUrl` take. */
  searchQuery: FindResourcesQuery;
  clarify: LegacyAiClarifyState | null;
  /** Where the page redirects, in a `page:redirect` state. */
  redirectTo?: string;
};

export type ResolverEvent = {
  /** Prediction runs outside the machine (ml-broker); its answer, or null when it failed, comes back here. */
  type: 'PREDICTION_RESOLVED';
  prediction: AiPredictResponse | null;
};

/**
 * Resolves a search intent to what the page does. Pure: the server calls `initialTransition` on it and,
 * from `needs_prediction`, `transition` with the prediction; no actor is made and nothing is kept between
 * requests. Today's deep-link gate, unchanged (ISS-2294 is a pure migration):
 *
 * - `resolving` tries each of the old gate's early returns in order; any of them searches as the URL says;
 * - otherwise the query is classified, and the answer redirects to the canonical AI URL or the clarify URL;
 * - a URL that carries clarify state renders it beside the results.
 */
export const searchResolverMachine = setup({
  types: {
    input: {} as ResolverInput,
    context: {} as ResolverContext,
    events: {} as ResolverEvent,
    tags: {} as PageAction,
  },
  guards: {
    /** A tenant whose needs are refine (not AI classification): the gate does not run. */
    needsRefined: ({ context }) => context.policy.needs !== 'gate',
    loopGuarded: ({ context }) => context.loopGuard,
    /** Gate case A: hybrid with taxonomy is already the canonical AI URL. */
    canonicalAi: ({ context }) =>
      context.searchQuery.queryType === 'hybrid' &&
      Boolean(context.searchQuery.taxonomy?.length),
    /** Gate case C: a taxonomy search needs no classifying. */
    taxonomySearch: ({ context }) =>
      context.searchQuery.queryType === 'taxonomy',
    noQuery: ({ context }) => !context.searchQuery.query,
    clarifyStated: ({ context }) => context.clarify !== null,
    predictionMissing: ({ event }) => !event.prediction,
    directScenario: ({ event }) =>
      DIRECT_SCENARIOS.includes(event.prediction?.scenario ?? null),
  },
}).createMachine({
  id: 'searchResolver',
  context: ({ input }) => ({
    ...input,
    searchQuery: toFindResourcesQuery(input.intent),
    clarify: toLegacyAiClarifyState(input.intent),
  }),
  initial: 'resolving',
  states: {
    resolving: {
      always: [
        { guard: 'needsRefined', target: 'settled' },
        { guard: 'loopGuarded', target: 'settled' },
        { guard: 'canonicalAi', target: 'settled' },
        { guard: 'taxonomySearch', target: 'settled' },
        { guard: 'noQuery', target: 'settled' },
        // Gate cases B (hybrid without taxonomy) and D (text, or no query type).
        { target: 'needs_prediction' },
      ],
    },
    needs_prediction: {
      // Results wait for the prediction: on the server it is awaited before anything renders.
      tags: 'page:render-gate',
      on: {
        PREDICTION_RESOLVED: [
          { guard: 'predictionMissing', target: 'settled' },
          {
            guard: 'directScenario',
            target: 'redirect_canonical',
            actions: assign({
              redirectTo: ({ context, event }) =>
                buildSearchUrl({
                  ...context.searchQuery,
                  aiScenario: event.prediction?.scenario,
                  taxonomies: event.prediction?.hsis_taxonomies,
                  searchEngine: context.searchEngine,
                  skipLegacyLinkCheck: true,
                }),
            }),
          },
          {
            target: 'redirect_clarify',
            actions: assign({
              redirectTo: ({ context, event }) =>
                buildSearchUrl({
                  ...context.searchQuery,
                  clarifyOptions: optionsOf(event.prediction),
                  clarifyScenario: event.prediction?.scenario,
                  searchEngine: context.searchEngine,
                  skipLegacyLinkCheck: true,
                }),
            }),
          },
        ],
      },
    },
    /** The search runs as the URL says; only clarify state carried by the URL is left to show. */
    settled: {
      always: [
        { guard: 'clarifyStated', target: 'clarify_needs' },
        { target: 'ready' },
      ],
    },
    /** The URL carries clarify state: the clarify dialog opens beside the results. */
    clarify_needs: { tags: 'page:render-gate' },
    ready: { tags: 'page:render-results' },
    redirect_canonical: { tags: 'page:redirect' },
    redirect_clarify: { tags: 'page:redirect' },
  },
});

/** The page action of a resolved state. */
export function pageActionOf(snapshot: {
  hasTag: (tag: PageAction) => boolean;
}): PageAction {
  const actions = PAGE_ACTIONS.filter((tag) => snapshot.hasTag(tag));
  if (actions.length !== 1) {
    throw new Error(
      `a resolved search state must carry exactly one page action, found ${actions.length}`,
    );
  }
  return actions[0];
}
