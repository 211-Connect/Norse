// Prototype: the pure v2 rules the page applies to `GET /v2/search` (ADR 0039 Decisions 51, 55, 56).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answerChanges,
  cardWording,
  emergencyQuestionOf,
  groupByMatchedNeeds,
  isSoftEmergency,
  isWeakMatch,
  noMatchQuestionOf,
  otherChanges,
  nextV2Params,
  styleOf,
  emergencyPopupMode,
  withEmergencyAnswers,
  type V2Question,
  type V2Response,
} from '../src/app/(app)/features/search/v2/v2-contract';

const RENT = 'N-HOU-02';
const FOOD = 'N-FOD-01';

test('groupByMatchedNeeds: all, some and none, in the order the hits came', () => {
  const groups = groupByMatchedNeeds(
    [
      { matched_needs: [RENT, FOOD] },
      { matched_needs: [FOOD] },
      { matched_needs: [] },
      { matched_needs: [RENT] },
    ],
    [RENT, FOOD],
  );
  assert.deepStrictEqual(groups, ['all', 'some', 'none', 'some']);
});

test('groupByMatchedNeeds: one selected need gives only all or none', () => {
  assert.deepStrictEqual(
    groupByMatchedNeeds([{ matched_needs: [RENT] }, { matched_needs: [] }], [RENT]),
    ['all', 'none'],
  );
});

test('groupByMatchedNeeds: no selected needs, or no matched_needs on a hit, gives no group', () => {
  assert.deepStrictEqual(groupByMatchedNeeds([{ matched_needs: [] }, {}], []), [null, null]);
  assert.deepStrictEqual(groupByMatchedNeeds([{}, { matched_needs: [RENT] }], [RENT]), [
    null,
    'all',
  ]);
});

test('groupByMatchedNeeds: codes that were not selected, and repeats, do not count', () => {
  assert.deepStrictEqual(
    groupByMatchedNeeds([{ matched_needs: ['N-MON-02', RENT, RENT] }], [RENT, FOOD]),
    ['some'],
  );
});

test('nextV2Params: a new query text drops urgency, needs and passed_needs (Decision 51)', () => {
  const current = new URLSearchParams(
    `query=rent&needs=${RENT}&passed_needs=${FOOD}&urgency=U-1&location=Sampleton&page=2`,
  );
  const next = nextV2Params(current, { query: 'food' });
  assert.equal(next.get('query'), 'food');
  assert.equal(next.has('needs'), false);
  assert.equal(next.has('passed_needs'), false);
  assert.equal(next.has('urgency'), false);
  assert.equal(next.get('location'), 'Sampleton');
  assert.equal(next.has('page'), false);
});

test('nextV2Params: the same query text, or an answer, keeps the other answers', () => {
  const current = new URLSearchParams(`query=rent&needs=${RENT}&urgency=U-1`);
  const same = nextV2Params(current, { query: ' rent ', passed_needs: [FOOD] });
  assert.equal(same.get('needs'), RENT);
  assert.equal(same.get('urgency'), 'U-1');
  assert.equal(same.get('passed_needs'), FOOD);
  const answer = nextV2Params(current, { urgency: 'U-3' });
  assert.equal(answer.get('needs'), RENT);
  assert.equal(answer.get('urgency'), 'U-3');
});

test('nextV2Params: a new query that sets needs itself keeps those needs', () => {
  const current = new URLSearchParams(`query=rent&needs=${RENT}&urgency=U-1`);
  const next = nextV2Params(current, { query: 'food', needs: [FOOD] });
  assert.equal(next.get('needs'), FOOD);
  assert.equal(next.has('urgency'), false);
});

const question = (options: V2Question['options']): V2Question => ({
  id: 'q',
  type: 'find_need',
  importance: 'high',
  reason: 'unsure_needs',
  stem: 'Which fits?',
  options,
  multi_select: true,
  allow_other: false,
  none_of_these: true,
});

test('answerChanges: each option writes its own parameter (Decision 55)', () => {
  const q = question([
    { label: 'Help paying rent', parameter: 'needs', value: RENT },
    { label: 'Food', parameter: 'needs', value: FOOD },
    { label: 'Not urgent', parameter: 'urgency', value: 'U-3' },
  ]);
  const changes = answerChanges(q, [RENT, 'U-3'], { needs: [], passedNeeds: [] });
  assert.deepStrictEqual(changes, {
    urgency: 'U-3',
    needs: [RENT],
    passed_needs: [FOOD],
  });
});

test('answerChanges: a passed_needs option and an urgency skip', () => {
  const pass = question([
    { label: 'Not this', parameter: 'passed_needs', value: 'N-MON-02' },
  ]);
  assert.deepStrictEqual(answerChanges(pass, ['N-MON-02'], { needs: [RENT], passedNeeds: [] }), {
    passed_needs: ['N-MON-02'],
  });
  const time = question([
    { label: 'Today', parameter: 'urgency', value: 'U-1' },
    { label: 'Not urgent', parameter: 'urgency', value: 'U-3' },
  ]);
  assert.deepStrictEqual(answerChanges(time, [], { needs: [], passedNeeds: [] }), {
    urgency: 'U-X',
  });
});

test('answerChanges: the emergency popup answers write U-0, U-1 and U-2 (Lucas 2026-11-18)', () => {
  const q = withEmergencyAnswers({ ...question([]), id: 'emergency', type: 'emergency', importance: 'critical' });
  for (const code of ['U-0', 'U-1', 'U-2']) {
    assert.equal(answerChanges(q, [code], { needs: [], passedNeeds: [] }).urgency, code);
  }
});

test('withEmergencyAnswers: exactly three options; the engine values win when all three match', () => {
  const base = { ...question([]), id: 'emergency', type: 'emergency' as const, importance: 'critical' as const };
  const mine = withEmergencyAnswers(base);
  assert.deepStrictEqual(mine.options.map((o) => [o.label, o.value, o.parameter]), [
    ['Yes, I am in danger', 'U-0', 'urgency'],
    ['No, I am safe, I need help today', 'U-1', 'urgency'],
    ['No, I am safe, I need help this week', 'U-2', 'urgency'],
  ]);
  const engine = (label: string, value: string) => ({ label, parameter: 'urgency' as const, value, results_count: null });
  const theirs = withEmergencyAnswers({
    ...base,
    options: [engine('A', 'U-2'), engine('B', 'U-0'), engine('C', 'U-1'), engine('D', 'U-3')],
  });
  assert.deepStrictEqual(theirs.options.map((o) => o.label), ['B', 'C', 'A']);
  // Older engine options (two answers, other codes): the page's own three.
  const old = withEmergencyAnswers({ ...base, options: [engine('x', 'U-1'), engine('y', 'U-2')] });
  assert.equal(old.options[0].label, 'Yes, I am in danger');
});

test('emergencyPopupMode: ask, danger, or none', () => {
  const crit = { id: 'emergency', importance: 'critical' as const };
  assert.equal(emergencyPopupMode(crit, null, []), 'ask');
  assert.equal(emergencyPopupMode(crit, 'U-0', ['emergency']), 'danger');
  for (const u of ['U-1', 'U-2', 'U-3', 'U-4']) assert.equal(emergencyPopupMode(crit, u, ['emergency']), null);
  assert.equal(emergencyPopupMode(crit, null, ['emergency']), null);
  assert.equal(emergencyPopupMode({ id: 'emergency', importance: 'high' }, null, []), null);
  assert.equal(emergencyPopupMode(undefined, null, []), null);
});

test('emergencyQuestionOf reads the emergency only from the questions (Decision 54)', () => {
  const emergency = { ...question([]), id: 'emergency', type: 'emergency' as const, importance: 'critical' as const };
  const response = {
    clarification: { rules_version: 'r', questions: [question([]), emergency] },
  } as unknown as V2Response;
  assert.equal(emergencyQuestionOf(response)?.importance, 'critical');
  assert.equal(emergencyQuestionOf(undefined), undefined);
});

test('withoutNX: N-X is never sent in needs= (Decision 43: the route would answer 400)', async () => {
  const { withoutNX } = await import('../src/app/(app)/features/search/v2/v2-contract');
  assert.equal(withoutNX('N-HOU-02,N-X,N-FOD-01'), 'N-HOU-02,N-FOD-01');
  assert.equal(withoutNX('N-X'), null);
  assert.equal(withoutNX(null), null);
});

test('styleOf: the look follows type and importance, never a `level` field', () => {
  const kinds = ['emergency', 'confirm_urgency', 'find_need', 'narrow'] as const;
  const high = ['critical', 'high'] as const;
  const quiet = ['medium', 'low'] as const;
  for (const importance of [...high, ...quiet]) {
    assert.equal(styleOf({ type: 'emergency', importance }), 'emergency');
  }
  for (const importance of high) {
    assert.equal(styleOf({ type: 'confirm_urgency', importance }), 'confirm_urgency');
    assert.equal(styleOf({ type: 'find_need', importance }), 'find_need');
    assert.equal(styleOf({ type: 'narrow', importance }), 'find_need');
  }
  for (const importance of quiet) {
    for (const type of kinds.filter((k) => k !== 'emergency')) {
      assert.equal(styleOf({ type, importance }), 'narrow');
    }
  }
});

test('isSoftEmergency: critical is the full red card, anything lower the calmer one', () => {
  assert.equal(isSoftEmergency({ importance: 'critical' }), false);
  assert.equal(isSoftEmergency({ importance: 'high' }), true);
  assert.equal(isSoftEmergency(undefined), false);
});


test('cardWording: a one-need question is one tap, not "Pick all that fit"', () => {
  const opt = (value: string) => ({ label: value, parameter: 'needs', value, results_count: null });
  const none = { label: 'None', parameter: 'passed_needs', value: 'x', results_count: null };
  assert.deepEqual(
    cardWording({ stem: 'Do any of these also fit?', multi_select: true, options: [opt('N-SAF-04')] } as never),
    { text: 'Does this also fit?', multi: false },
  );
  assert.deepEqual(
    cardWording({ stem: 'Which kind of help with Food & Water?', multi_select: true, options: [opt('N-FOD-01'), none] } as never),
    { text: 'Which kind of help with Food & Water?', multi: false },
  );
  assert.deepEqual(
    cardWording({ stem: 'Do any of these also fit?', multi_select: true, options: [opt('a'), opt('b')] } as never),
    { text: 'Do any of these also fit?', multi: true },
  );
});

const noMatch: V2Question = {
  id: 'no_match',
  type: 'find_need',
  importance: 'high',
  reason: 'weak_match',
  stem: 'We could not find a good match. What do you need help with?',
  options: [
    { label: 'Food', parameter: 'needs', value: 'N-FOD' },
    { label: 'Housing', parameter: 'needs', value: 'N-HOU' },
    { label: 'Money', parameter: 'needs', value: 'N-MON' },
  ],
  multi_select: true,
  allow_other: true,
  none_of_these: true,
};

test('weak match: a Tier 1 pick writes needs and does not pass the other options', () => {
  const changes = answerChanges(noMatch, ['N-FOD'], { needs: [], passedNeeds: [] });
  assert.deepStrictEqual(changes, { needs: ['N-FOD'] });
  const url = nextV2Params(new URLSearchParams('query=zzqx'), changes);
  assert.equal(url.get('needs'), 'N-FOD');
  assert.equal(url.get('query'), 'zzqx');
  assert.equal(url.has('passed_needs'), false);
});

test('weak match: Other text joins the query and writes no needs and no `other`', () => {
  const state = { needs: [], passedNeeds: [] };
  const first = otherChanges(noMatch, 'zzqx', 'rent help', state);
  assert.equal(first.query, 'zzqx. rent help');
  assert.equal('other' in first, false);
  assert.deepStrictEqual(first.needs, []);
  assert.equal(otherChanges(noMatch, null, 'a ride to dialysis', state).query, 'a ride to dialysis');
  assert.equal(otherChanges(noMatch, 'first', 'second', state).query, 'first. second');
});

test('Other text keeps the answers although the query text changes', () => {
  const state = { needs: ['N-FOD'], passedNeeds: ['N-HOU'], urgency: 'U-2' };
  const changes = otherChanges(noMatch, 'zzqx', 'rent help', state);
  const next = nextV2Params(
    new URLSearchParams('query=zzqx&needs=N-FOD&passed_needs=N-HOU&urgency=U-2&asked=no_match'),
    { ...changes, asked: ['no_match'] },
  );
  assert.equal(next.get('query'), 'zzqx. rent help');
  assert.equal(next.get('needs'), 'N-FOD');
  assert.equal(next.get('passed_needs'), 'N-HOU');
  assert.equal(next.get('urgency'), 'U-2');
  assert.equal(next.has('other'), false);
  assert.equal(next.has('query_label'), false);
});

test('Other text on another question still answers like a Skip', () => {
  const rent: V2Question = { ...noMatch, id: 'area_hou' };
  const changes = otherChanges(rent, 'rent', 'x', { needs: [], passedNeeds: [] });
  assert.equal(changes.query, 'rent. x');
  assert.deepStrictEqual(changes.passed_needs, ['N-FOD', 'N-HOU', 'N-MON']);
});

test('isWeakMatch and noMatchQuestionOf read the response', () => {
  const base = { clarification: { rules_version: 'r', questions: [noMatch] } } as unknown as V2Response;
  assert.equal(isWeakMatch(base), false);
  assert.equal(isWeakMatch({ ...base, weak_match: true }), true);
  assert.equal(noMatchQuestionOf(base)?.id, 'no_match');
});

test('nextV2Params: a new query text also drops asked (Question 22.3)', () => {
  const current = new URLSearchParams(
    'query=rent&asked=U-1,start&location=Sampleton',
  );
  const next = nextV2Params(current, { query: 'food' });
  assert.equal(next.has('asked'), false);
  assert.equal(next.get('location'), 'Sampleton');
  const same = nextV2Params(current, { query: ' rent ' });
  assert.equal(same.get('asked'), 'U-1,start');
});
