import { and, assign, setup } from 'xstate';

import {
  toFindResourcesQuery,
  toLegacyAiClarifyState,
  type SearchIntent,
} from '@/app/(app)/features/search/intent';
import { buildAiNeedWeights } from '@/app/(app)/features/search/utils/buildAiNeedWeights';
import { buildSearchUrl } from '@/app/(app)/features/search/utils/buildSearchUrl';
import type { LegacyAiClarifyState } from '@/app/(app)/features/search/utils/parseLegacyAiClarifyParams';
import type {
  AiClassificationScenario,
  AiPredictOption,
  AiPredictResponse,
} from '@/app/(app)/shared/services/ai-classification-search-service';
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

/** What the search dialog submits: its own search, not the URL's. */
export type DialogSubmission = {
  /** The picked or typed query, trimmed. */
  query: string;
  queryType: string;
  organizationId: string;
  href: string;
  target: string;
  location: string;
};

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
  /** Where the page redirects, in a `page:redirect` state reached from the URL. */
  redirectTo?: string;
  /** Who asked for the prediction: the URL on the server, or the dialog's submit. */
  origin: 'url' | 'dialog';
  submission?: DialogSubmission;
  /** The dialog's clarify step: the options it shows (null when hidden), the codes picked, the scenario. */
  clarifyOptions: AiPredictOption[] | null;
  selectedCodes: string[];
  scenario?: AiClassificationScenario;
  /** Confirm was pressed with nothing to re-rank on. */
  needsSelection: boolean;
};

export type ResolverEvent =
  | {
      /** Prediction runs outside the machine (ml-broker); its answer, or null when it failed, comes back here. */
      type: 'PREDICTION_RESOLVED';
      prediction: AiPredictResponse | null;
    }
  /** The dialog's submit, routed by `useOnSearchSubmit`. */
  | { type: 'SUBMIT'; submission: DialogSubmission }
  /** What `useOnSearchSubmit` reports to the dialog while it classifies a submit. */
  | { type: 'PREDICTION_REQUESTED' }
  | { type: 'PREDICTION_SETTLED' }
  | { type: 'SCENARIO_RESOLVED'; scenario?: AiClassificationScenario }
  | { type: 'OPTIONS_OFFERED'; options: AiPredictOption[] }
  | { type: 'CODES_SELECTED'; codes: string[] }
  | { type: 'VALIDATION_CLEARED' }
  /** The user, in the dialog's clarify step. */
  | { type: 'CODE_TOGGLED'; code: string }
  | { type: 'QUERY_EDITED' }
  | { type: 'SKIPPED'; pending: boolean }
  | { type: 'CONFIRMED'; pending: boolean }
  /** The re-rank (ml-broker), run outside the machine; null when it failed. */
  | { type: 'RERANK_RESOLVED'; taxonomies: string[] | null }
  /** Navigation from the dialog: refused (nothing to search) or settled (the transition ended). */
  | { type: 'NAVIGATION_REFUSED' }
  | { type: 'NAVIGATION_SETTLED' };

/** The dialog's submit, from any state that lets the user search again. */
const SUBMIT_ROUTES = [
  { guard: 'linkTopic', target: 'following_link' },
  { guard: 'locationRequired', target: 'location_required' },
  { guard: 'classicSubmit', target: 'navigating_classic' },
  { target: 'needs_prediction', actions: 'rememberSubmission' },
] as const;

/**
 * Resolves a search intent to what the page does, and runs the search dialog on the same states.
 *
 * - **The server** calls `initialTransition` and, from `needs_prediction`, `transition` with the
 *   prediction; it is pure, no actor is made, nothing is kept between requests. `resolving` tries each of
 *   the old deep-link gate's early returns in order, and the prediction redirects to the canonical AI URL
 *   or the clarify URL. A URL that carries clarify state renders it beside the results.
 * - **The dialog's submit** (`useOnSearchSubmit`) routes a `SUBMIT` the same pure way: a link topic, the
 *   location policy, a classic search, or a prediction that navigates or offers clarify options.
 * - **The dialog** (`SearchDialog`) runs an actor of this machine through `useMachine`, with the
 *   navigation, re-rank and toast effects supplied by `machine.provide()`.
 *
 * ISS-2294 is a pure migration: every outcome is today's.
 */
export const searchResolverMachine = setup({
  types: {
    input: {} as ResolverInput,
    context: {} as ResolverContext,
    events: {} as ResolverEvent,
    tags: {} as PageAction,
  },
  actions: {
    rememberSubmission: assign({
      origin: 'dialog' as const,
      submission: ({ event }) =>
        event.type === 'SUBMIT' ? event.submission : undefined,
    }),
    clearClarify: assign({
      clarifyOptions: null,
      selectedCodes: [],
      needsSelection: false,
    }),
    // Effects the client supplies with `machine.provide()`; on the server they are never reached.
    clarifyActed: () => {},
    navigateSkipped: () => {},
    requestRerank: () => {},
    navigateConfirmed: (_, _params: { taxonomies: string[] }) => {},
    notifyRerankFailed: () => {},
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
    predictionMissing: ({ event }) =>
      event.type === 'PREDICTION_RESOLVED' && !event.prediction,
    directScenario: ({ event }) =>
      event.type === 'PREDICTION_RESOLVED' &&
      DIRECT_SCENARIOS.includes(event.prediction?.scenario ?? null),
    fromDialog: ({ context }) => context.origin === 'dialog',
    clarifyShown: ({ context }) => context.clarifyOptions !== null,
    /** A typeahead topic of type link opens its href. */
    linkTopic: ({ event }) =>
      event.type === 'SUBMIT' &&
      event.submission.queryType === 'link' &&
      Boolean(event.submission.href),
    /** The location slot as gate: the dialog's submit needs a location. */
    locationRequired: ({ context, event }) =>
      event.type === 'SUBMIT' &&
      context.policy.location === 'gate' &&
      event.submission.location.trim().length === 0,
    /**
     * Searched as typed, not classified: needs is refine, a taxonomy pick, an organization scope (a filter,
     * not a classifiable text query), or no query.
     */
    classicSubmit: ({ context, event }) =>
      event.type === 'SUBMIT' &&
      (context.policy.needs !== 'gate' ||
        event.submission.queryType === 'taxonomy' ||
        Boolean(event.submission.organizationId) ||
        !event.submission.query),
    pending: ({ event }) =>
      (event.type === 'SKIPPED' || event.type === 'CONFIRMED') && event.pending,
    nothingSelected: ({ context }) => context.selectedCodes.length === 0,
    nothingToRerank: ({ context }) =>
      Object.keys(
        buildAiNeedWeights(context.clarifyOptions ?? [], context.selectedCodes),
      ).length === 0,
    rerankFailed: ({ event }) =>
      event.type === 'RERANK_RESOLVED' && !event.taxonomies,
  },
}).createMachine({
  id: 'searchResolver',
  context: ({ input }) => {
    const clarify = toLegacyAiClarifyState(input.intent);
    return {
      ...input,
      searchQuery: toFindResourcesQuery(input.intent),
      clarify,
      origin: 'url',
      clarifyOptions: clarify?.options.length ? clarify.options : null,
      selectedCodes: clarify?.selectedCodes ?? [],
      scenario: clarify?.scenario,
      needsSelection: false,
    };
  },
  initial: 'resolving',
  on: {
    // The dialog's own bookkeeping, in whichever state it is.
    SCENARIO_RESOLVED: {
      actions: assign({ scenario: ({ event }) => event.scenario }),
    },
    CODES_SELECTED: {
      actions: assign({ selectedCodes: ({ event }) => event.codes }),
    },
    VALIDATION_CLEARED: { actions: assign({ needsSelection: false }) },
    CODE_TOGGLED: {
      actions: assign({
        needsSelection: false,
        selectedCodes: ({ context, event }) =>
          context.selectedCodes.includes(event.code)
            ? context.selectedCodes.filter((code) => code !== event.code)
            : [...context.selectedCodes, event.code],
      }),
    },
    QUERY_EDITED: {
      guard: 'clarifyShown',
      actions: 'clearClarify',
    },
  },
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
      // Results wait for the prediction: the server awaits it, the dialog shows it loading.
      tags: 'page:render-gate',
      on: {
        PREDICTION_RESOLVED: [
          // The dialog's submit: search as typed, navigate, or offer clarify options.
          {
            guard: and(['fromDialog', 'predictionMissing']),
            target: 'navigating_classic',
          },
          {
            guard: and(['fromDialog', 'directScenario']),
            target: 'navigating_ai',
            actions: assign({
              scenario: ({ event }) => event.prediction?.scenario,
            }),
          },
          {
            guard: 'fromDialog',
            target: 'clarify_needs',
            actions: assign(({ event }) => {
              const options = optionsOf(event.prediction);
              return {
                scenario: event.prediction?.scenario,
                clarifyOptions: options,
                selectedCodes: options
                  .filter((option) => option.pre_selected)
                  .map((option) => option.code),
              };
            }),
          },
          // The URL, on the server.
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
        // The dialog's actor hears that classifying ended; what follows comes as its own events.
        PREDICTION_SETTLED: { target: 'idle' },
      },
    },
    /** The search runs as the URL says; only clarify state carried by the URL is left to show. */
    settled: {
      always: [
        { guard: 'clarifyStated', target: 'clarify_needs' },
        { target: 'ready' },
      ],
    },
    /** Back to rest in the dialog: the clarify step stays up if its options still are. */
    idle: {
      always: [
        { guard: 'clarifyShown', target: 'clarify_needs' },
        { target: 'ready' },
      ],
    },
    /** Clarify options are up: the dialog asks, beside the results. */
    clarify_needs: {
      tags: 'page:render-gate',
      on: {
        SUBMIT: SUBMIT_ROUTES,
        PREDICTION_REQUESTED: { target: 'needs_prediction' },
        OPTIONS_OFFERED: {
          target: 'clarify_needs',
          actions: assign({ clarifyOptions: ({ event }) => event.options }),
        },
        QUERY_EDITED: { target: 'ready', actions: 'clearClarify' },
        SKIPPED: [
          { guard: 'pending' },
          { target: 'skipping', actions: 'clarifyActed' },
        ],
        CONFIRMED: [
          { guard: 'pending' },
          {
            guard: 'nothingSelected',
            actions: assign({ needsSelection: true }),
          },
          {
            guard: 'nothingToRerank',
            actions: ['clarifyActed', assign({ needsSelection: true })],
          },
          {
            target: 'confirming',
            actions: ['clarifyActed', assign({ needsSelection: false })],
          },
        ],
      },
    },
    ready: {
      tags: 'page:render-results',
      on: {
        SUBMIT: SUBMIT_ROUTES,
        PREDICTION_REQUESTED: { target: 'needs_prediction' },
        OPTIONS_OFFERED: {
          target: 'clarify_needs',
          actions: assign({ clarifyOptions: ({ event }) => event.options }),
        },
      },
    },
    /** Skip: search the query without a taxonomy. */
    skipping: {
      tags: 'page:redirect',
      entry: 'navigateSkipped',
      on: {
        NAVIGATION_REFUSED: { target: 'idle' },
        NAVIGATION_SETTLED: { target: 'idle' },
      },
    },
    /** Confirm: re-rank the picked needs, then search with their taxonomy. */
    confirming: {
      tags: 'page:render-gate',
      entry: 'requestRerank',
      on: {
        RERANK_RESOLVED: [
          {
            guard: 'rerankFailed',
            target: 'idle',
            actions: 'notifyRerankFailed',
          },
          {
            target: 'confirmed',
            actions: {
              type: 'navigateConfirmed',
              params: ({ event }) => ({
                taxonomies:
                  event.type === 'RERANK_RESOLVED'
                    ? (event.taxonomies ?? [])
                    : [],
              }),
            },
          },
        ],
      },
    },
    confirmed: {
      tags: 'page:redirect',
      on: { NAVIGATION_SETTLED: { target: 'idle' } },
    },
    /** The dialog's submit outcomes; `useOnSearchSubmit` performs each. */
    following_link: { tags: 'page:redirect' },
    location_required: {
      tags: 'page:render-gate',
      on: { SUBMIT: SUBMIT_ROUTES },
    },
    navigating_classic: { tags: 'page:redirect' },
    navigating_ai: { tags: 'page:redirect' },
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
