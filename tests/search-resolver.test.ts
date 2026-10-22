// The search resolver's permanent tests: every state carries one page action, the deep-link gate's
// A/B/C/D outcomes, and what gate and refine policy do, all over the one machine.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  createActor,
  initialTransition,
  transition,
  type AnyStateNode,
} from 'xstate';

import { liftQueryString } from '../src/app/(app)/features/search/intent';
import {
  PAGE_ACTIONS,
  pageActionOf,
  searchResolverMachine,
  type DialogSubmission,
  type ResolverInput,
  type SearchPolicy,
} from '../src/app/(app)/features/search/resolver';
import type { AiPredictResponse } from '../src/app/(app)/shared/services/ai-classification-search-service';

import { resolverDiagram } from './search-resolver-diagram';
import { ALL_FIXTURES } from './search-intent-fixtures';

const AI: SearchPolicy = { needs: 'gate', location: 'refine' };
const CLASSIC: SearchPolicy = { needs: 'refine', location: 'refine' };

function input(query: string, policy: SearchPolicy): ResolverInput {
  const { intent, envelope } = liftQueryString(query);
  return {
    intent,
    loopGuard: envelope.sllc === '1',
    policy,
    searchEngine: policy.needs === 'gate' ? 'ai_classification' : 'classic',
  };
}

const resolve = (query: string, policy: SearchPolicy) =>
  initialTransition(searchResolverMachine, input(query, policy))[0];

const predicted = (
  query: string,
  prediction: AiPredictResponse | null,
  policy: SearchPolicy = AI,
) => {
  const snapshot = resolve(query, policy);
  assert.equal(snapshot.value, 'needs_prediction');
  return transition(searchResolverMachine, snapshot, {
    type: 'PREDICTION_RESOLVED',
    prediction,
  })[0];
};

const PREDICT_SEARCH: AiPredictResponse = {
  scenario: 'search',
  hsis_taxonomies: ['BD-1800.2000', 'BD-5000'],
  options: [],
};
const PREDICT_NOTIFY: AiPredictResponse = {
  scenario: 'search_and_notify_low_info',
  hsis_taxonomies: ['BD-1800'],
  options: [],
};
const PREDICT_CLARIFY: AiPredictResponse = {
  scenario: 'clarify_multiple_labels',
  hsis_taxonomies: [],
  options: [
    { code: 'food', score: 0.6, pre_selected: true, results_count: 12 },
    { code: 'housing', score: 0.3, pre_selected: false },
  ] as AiPredictResponse['options'],
};

/** Every state node in the machine, nested ones included. */
function stateNodes(node: AnyStateNode = searchResolverMachine.root) {
  const children = Object.values(node.states) as AnyStateNode[];
  return [
    ...(node === searchResolverMachine.root ? [] : [node]),
    ...children.flatMap((child) => stateNodes(child)),
  ];
}

/** The page-action tags a snapshot in this state has: its own and its ancestors', as `hasTag` reads them. */
function pageActionsOn(node: AnyStateNode): string[] {
  const tags: string[] = [];
  for (let at: AnyStateNode | undefined = node; at; at = at.parent) {
    tags.push(
      ...at.tags.filter((tag) =>
        (PAGE_ACTIONS as readonly string[]).includes(tag),
      ),
    );
  }
  return tags;
}

/** A transient state cannot be rested in: its last `always` transition has no guard. */
const isTransient = (node: AnyStateNode) => {
  const always = node.always ?? [];
  return always.length > 0 && !always[always.length - 1].guard;
};

test('every state carries exactly one page action, or is transient', () => {
  const nodes = stateNodes();
  assert.ok(nodes.length >= 7, `only ${nodes.length} state nodes found`);
  // A snapshot rests in leaf states, so each leaf, nested ones included, is checked with its ancestors.
  const wrong = nodes
    .filter((node) => node.type !== 'compound' && node.type !== 'parallel')
    .map((node) => ({
      id: node.id,
      transient: isTransient(node),
      actions: pageActionsOn(node),
    }))
    .filter(({ transient, actions }) =>
      transient ? actions.length !== 0 : actions.length !== 1,
    );
  assert.deepStrictEqual(
    wrong,
    [],
    'a resting state needs exactly one page-action tag; a transient one needs none',
  );
});

test('a transient state is never where the machine rests', () => {
  const transient = new Set(
    stateNodes()
      .filter(isTransient)
      .map((node) => node.key),
  );
  assert.deepStrictEqual([...transient].sort(), [
    'idle',
    'resolving',
    'settled',
  ]);
  for (const fixture of ALL_FIXTURES) {
    for (const policy of [AI, CLASSIC]) {
      const snapshot = resolve(fixture.query, policy);
      assert.ok(!transient.has(String(snapshot.value)), fixture.query);
      pageActionOf(snapshot);
    }
  }
});

// The deep-link gate's A/B/C/D table, kept from the retired legacy-link doc, on an AI-classification tenant.

test('gate case A: hybrid with taxonomy searches as is', () => {
  const snapshot = resolve('query=food&query_type=hybrid&taxonomy=BD-1800', AI);
  assert.equal(snapshot.value, 'ready');
  assert.equal(pageActionOf(snapshot), 'page:render-results');
});

test('gate case B: hybrid without taxonomy is classified', () => {
  assert.equal(
    resolve('query=food&query_type=hybrid', AI).value,
    'needs_prediction',
  );
});

test('gate case C: a taxonomy search searches as is', () => {
  const snapshot = resolve(
    'query=BD-1800&query_label=Food&query_type=taxonomy',
    AI,
  );
  assert.equal(snapshot.value, 'ready');
});

test('gate case D: text, or no query type, is classified like B', () => {
  assert.equal(
    resolve('query=food&query_type=text', AI).value,
    'needs_prediction',
  );
  assert.equal(resolve('query=food', AI).value, 'needs_prediction');
});

test('the loop guard and an empty query are never classified', () => {
  assert.equal(
    resolve('query=food&query_type=hybrid&sllc=1', AI).value,
    'ready',
  );
  assert.equal(resolve('location=Seattle', AI).value, 'ready');
  assert.equal(resolve('query=&query_type=text', AI).value, 'ready');
});

test('a direct prediction redirects to the canonical AI URL', () => {
  const snapshot = predicted(
    'query=food&query_type=text&location=Seattle&coords=-122.3,47.6&page=4',
    PREDICT_SEARCH,
  );
  assert.equal(snapshot.value, 'redirect_canonical');
  assert.equal(pageActionOf(snapshot), 'page:redirect');
  assert.equal(
    snapshot.context.redirectTo,
    '/search?query=food&query_type=hybrid&taxonomy=BD-1800.2000%2CBD-5000&location=Seattle&coords=-122.3%2C47.6&sllc=1',
  );
});

test('a notify prediction writes its alert', () => {
  const snapshot = predicted('query=food', PREDICT_NOTIFY);
  assert.equal(snapshot.value, 'redirect_canonical');
  assert.equal(
    snapshot.context.redirectTo,
    '/search?query=food&query_type=hybrid&taxonomy=BD-1800&a=low_info&sllc=1',
  );
});

test('a clarify prediction redirects to the clarify URL', () => {
  const snapshot = predicted('query=food', PREDICT_CLARIFY);
  assert.equal(snapshot.value, 'redirect_clarify');
  assert.equal(
    snapshot.context.redirectTo,
    '/search?query=food&query_type=hybrid&ai_scenario=clarify_multiple_labels' +
      '&ai_options%5B0%5D%5Bcode%5D=food&ai_options%5B0%5D%5Bscore%5D=0.6' +
      '&ai_options%5B0%5D%5Bpre_selected%5D=1&ai_options%5B0%5D%5Bresults_count%5D=12' +
      '&ai_options%5B1%5D%5Bcode%5D=housing&ai_options%5B1%5D%5Bscore%5D=0.3' +
      '&ai_options%5B1%5D%5Bpre_selected%5D=0&sllc=1',
  );
});

test('a failed prediction searches as is', () => {
  const snapshot = predicted('query=food', null);
  assert.equal(snapshot.value, 'ready');
  assert.equal(snapshot.context.redirectTo, undefined);
});

test('the clarify URL the resolver writes renders the clarify gate beside the results', () => {
  const written = predicted('query=food', PREDICT_CLARIFY).context.redirectTo;
  const snapshot = resolve(written!.replace('/search?', ''), AI);
  assert.equal(snapshot.value, 'clarify_needs');
  assert.equal(pageActionOf(snapshot), 'page:render-gate');
  assert.deepStrictEqual(snapshot.context.clarify?.selectedCodes, ['food']);
});

// Policy: the same machine, gate or refine.

test('needs as refine never asks for a prediction or produces a gate from a search', () => {
  for (const fixture of ALL_FIXTURES) {
    const snapshot = resolve(fixture.query, CLASSIC);
    const carriesClarify = snapshot.context.clarify !== null;
    assert.equal(
      snapshot.value,
      carriesClarify ? 'clarify_needs' : 'ready',
      fixture.query,
    );
  }
});

test('needs as gate holds results back for the prediction', () => {
  const snapshot = resolve('query=food', AI);
  assert.equal(pageActionOf(snapshot), 'page:render-gate');
  assert.equal(
    pageActionOf(resolve('query=food', CLASSIC)),
    'page:render-results',
  );
});

test('the location policy does not change what the server does (it gates only the dialog submit)', () => {
  for (const fixture of ALL_FIXTURES) {
    for (const needs of ['gate', 'refine'] as const) {
      const refine = resolve(fixture.query, { needs, location: 'refine' });
      const gate = resolve(fixture.query, { needs, location: 'gate' });
      assert.equal(gate.value, refine.value, fixture.query);
      assert.deepStrictEqual(gate.context.clarify, refine.context.clarify);
    }
  }
});

test('the resolver is pure: the same input resolves the same way, with no actions to run', () => {
  for (const fixture of ALL_FIXTURES) {
    const [first, firstActions] = initialTransition(
      searchResolverMachine,
      input(fixture.query, AI),
    );
    const [second] = initialTransition(
      searchResolverMachine,
      input(fixture.query, AI),
    );
    assert.equal(first.value, second.value);
    assert.deepStrictEqual(first.context, second.context);
    assert.deepStrictEqual(firstActions, []);
  }
});

test('the diagram in docs/search-intent.md is the machine', () => {
  const doc = readFileSync(
    join(import.meta.dirname, '../docs/search-intent.md'),
    'utf8',
  );
  const block = doc.match(/```mermaid\n([\s\S]*?)\n```/);
  assert.ok(block, 'docs/search-intent.md has no mermaid diagram');
  assert.equal(
    block[1],
    resolverDiagram(),
    'regenerate it: node --import tsx tests/search-resolver-diagram.ts',
  );
});

// The dialog: the same machine routes its submit (useOnSearchSubmit) and runs its clarify step (SearchDialog).

const dialogInput = (policy: SearchPolicy, query = ''): ResolverInput => ({
  ...input(query, policy),
  loopGuard: true,
});

const submission = (
  over: Partial<DialogSubmission> = {},
): DialogSubmission => ({
  query: 'food',
  queryType: '',
  organizationId: '',
  href: '',
  target: '',
  location: 'Seattle',
  ...over,
});

const submit = (policy: SearchPolicy, over: Partial<DialogSubmission> = {}) => {
  const [resting] = initialTransition(
    searchResolverMachine,
    dialogInput(policy),
  );
  assert.equal(resting.value, 'ready');
  return transition(searchResolverMachine, resting, {
    type: 'SUBMIT',
    submission: submission(over),
  })[0];
};

test('requireUserLocation: location as gate blocks only the dialog submit without a location', () => {
  const gated: SearchPolicy = { needs: 'gate', location: 'gate' };
  for (const location of ['', '   ']) {
    const blocked = submit(gated, { location });
    assert.equal(blocked.value, 'location_required');
    assert.equal(pageActionOf(blocked), 'page:render-gate');
  }
  assert.equal(submit(gated).value, 'needs_prediction');
  assert.equal(submit(AI, { location: '' }).value, 'needs_prediction');
  assert.equal(
    submit({ ...CLASSIC, location: 'gate' }, { location: '' }).value,
    'location_required',
  );
  // A link topic opens its href before the location is asked for, as it always has.
  assert.equal(
    submit(gated, { location: '', queryType: 'link', href: '/x' }).value,
    'following_link',
  );
});

test('the dialog submit searches as typed unless needs is a gate and there is a query to classify', () => {
  assert.equal(submit(CLASSIC).value, 'navigating_classic');
  assert.equal(
    submit(AI, { queryType: 'taxonomy' }).value,
    'navigating_classic',
  );
  assert.equal(
    submit(AI, { organizationId: 'org-1' }).value,
    'navigating_classic',
  );
  assert.equal(submit(AI, { query: '' }).value, 'navigating_classic');
  assert.equal(submit(AI).value, 'needs_prediction');
  assert.equal(
    submit(AI, { queryType: 'link', href: '' }).value,
    'needs_prediction',
  );
});

test("the dialog's prediction navigates, offers clarify options, or searches as typed", () => {
  const predicting = submit(AI);
  const after = (prediction: AiPredictResponse | null) =>
    transition(searchResolverMachine, predicting, {
      type: 'PREDICTION_RESOLVED',
      prediction,
    })[0];
  assert.equal(after(null).value, 'navigating_classic');
  const direct = after(PREDICT_NOTIFY);
  assert.equal(direct.value, 'navigating_ai');
  assert.equal(direct.context.scenario, 'search_and_notify_low_info');
  assert.equal(direct.context.redirectTo, undefined);
  const clarify = after(PREDICT_CLARIFY);
  assert.equal(clarify.value, 'clarify_needs');
  assert.equal(clarify.context.clarifyOptions?.length, 2);
  assert.deepStrictEqual(clarify.context.selectedCodes, ['food']);
});

/** A dialog actor with recording effects, as SearchDialog runs it through useMachine and provide(). */
function dialogActor(
  query: string,
  rerank: string[] | null = ['BH-1800.8500'],
) {
  const log: string[] = [];
  const actor = createActor(
    searchResolverMachine.provide({
      actions: {
        clarifyActed: () => void log.push('clarifyActed'),
        navigateSkipped: () => void log.push('navigateSkipped'),
        requestRerank: ({ context, self }) => {
          log.push(`rerank ${context.selectedCodes.join(',')}`);
          self.send({ type: 'RERANK_RESOLVED', taxonomies: rerank });
        },
        navigateConfirmed: (_, { taxonomies }) =>
          void log.push(`navigateConfirmed ${taxonomies.join(',')}`),
        notifyRerankFailed: () => void log.push('notifyRerankFailed'),
      },
    }),
    { input: dialogInput(AI, query) },
  ).start();
  return { actor, log, state: () => actor.getSnapshot() };
}

const CLARIFY_URL = predicted(
  'query=food',
  PREDICT_CLARIFY,
).context.redirectTo!.replace('/search?', '');

test('the dialog opens on the clarify step a clarify URL carries', () => {
  const { state } = dialogActor(CLARIFY_URL);
  assert.equal(state().value, 'clarify_needs');
  assert.deepStrictEqual(
    state().context.clarifyOptions?.map((o) => o.code),
    ['food', 'housing'],
  );
  assert.deepStrictEqual(state().context.selectedCodes, ['food']);
  assert.equal(state().context.scenario, 'clarify_multiple_labels');
  const { state: plain } = dialogActor('query=food');
  assert.equal(plain().value, 'ready');
  assert.equal(plain().context.clarifyOptions, null);
});

test('confirm re-ranks the picked needs, then navigates with their taxonomy', () => {
  const { actor, log, state } = dialogActor(CLARIFY_URL);
  actor.send({ type: 'CODE_TOGGLED', code: 'housing' });
  assert.deepStrictEqual(state().context.selectedCodes, ['food', 'housing']);
  actor.send({ type: 'CONFIRMED', pending: false });
  assert.deepStrictEqual(log, [
    'clarifyActed',
    'rerank food,housing',
    'navigateConfirmed BH-1800.8500',
  ]);
  assert.equal(state().value, 'confirmed');
  assert.equal(pageActionOf(state()), 'page:redirect');
  actor.send({ type: 'NAVIGATION_SETTLED' });
  assert.equal(state().value, 'clarify_needs');
});

test('confirm with nothing picked asks for a pick; a failed re-rank stays on the clarify step', () => {
  const { actor, log, state } = dialogActor(CLARIFY_URL, null);
  actor.send({ type: 'CODE_TOGGLED', code: 'food' });
  actor.send({ type: 'CONFIRMED', pending: false });
  assert.equal(state().value, 'clarify_needs');
  assert.equal(state().context.needsSelection, true);
  assert.deepStrictEqual(log, []);
  actor.send({ type: 'CODE_TOGGLED', code: 'housing' });
  assert.equal(state().context.needsSelection, false);
  actor.send({ type: 'CONFIRMED', pending: false });
  assert.deepStrictEqual(log, [
    'clarifyActed',
    'rerank housing',
    'notifyRerankFailed',
  ]);
  assert.equal(state().value, 'clarify_needs');
});

test('skip navigates without a taxonomy; a refused navigation returns to the clarify step', () => {
  const { actor, log, state } = dialogActor(CLARIFY_URL);
  actor.send({ type: 'SKIPPED', pending: true });
  assert.equal(state().value, 'clarify_needs');
  actor.send({ type: 'SKIPPED', pending: false });
  assert.equal(state().value, 'skipping');
  assert.deepStrictEqual(log, ['clarifyActed', 'navigateSkipped']);
  actor.send({ type: 'NAVIGATION_REFUSED' });
  assert.equal(state().value, 'clarify_needs');
});

test("the dialog follows the submit's prediction steps and clears the clarify step on an edit", () => {
  const { actor, state } = dialogActor('query=food');
  actor.send({ type: 'PREDICTION_REQUESTED' });
  assert.equal(state().value, 'needs_prediction');
  actor.send({ type: 'PREDICTION_SETTLED' });
  assert.equal(state().value, 'ready');
  actor.send({ type: 'SCENARIO_RESOLVED', scenario: 'clarify_low_info' });
  actor.send({ type: 'OPTIONS_OFFERED', options: PREDICT_CLARIFY.options });
  actor.send({ type: 'CODES_SELECTED', codes: ['food'] });
  assert.equal(state().value, 'clarify_needs');
  assert.equal(state().context.scenario, 'clarify_low_info');
  actor.send({ type: 'QUERY_EDITED' });
  assert.equal(state().value, 'ready');
  assert.equal(state().context.clarifyOptions, null);
  assert.deepStrictEqual(state().context.selectedCodes, []);
});
