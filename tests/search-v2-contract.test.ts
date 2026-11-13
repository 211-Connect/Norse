// Prototype: the pure v2 rules the page applies to `GET /v2/search` (ADR 0039 Decisions 51, 55, 56).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answerChanges,
  emergencyQuestionOf,
  groupByMatchedNeeds,
  isSoftEmergency,
  nextV2Params,
  styleOf,
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

test('answerChanges: the page never writes U-0', () => {
  const q = question([{ label: 'x', parameter: 'urgency', value: 'U-0' }]);
  assert.equal(answerChanges(q, ['U-0'], { needs: [], passedNeeds: [] }).urgency, undefined);
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
