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
  countTone,
  isNoneOption,
  OPTION_LIMIT,
  visibleOptions,
  otherChanges,
  optionDescription,
  nextV2Params,
  styleOf,
  styleOfQuestion,
  placementOf,
  canonicalType,
  stringsOf,
  nextQuestionOf,
  GUIDE_PLACEMENTS,
  REFINE_PLACEMENTS,
  emergencyPopupMode,
  withEmergencyAnswers,
  type V2Placement,
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
    groupByMatchedNeeds(
      [{ matched_needs: [RENT] }, { matched_needs: [] }],
      [RENT],
    ),
    ['all', 'none'],
  );
});

test('groupByMatchedNeeds: no selected needs, or no matched_needs on a hit, gives no group', () => {
  assert.deepStrictEqual(groupByMatchedNeeds([{ matched_needs: [] }, {}], []), [
    null,
    null,
  ]);
  assert.deepStrictEqual(
    groupByMatchedNeeds([{}, { matched_needs: [RENT] }], [RENT]),
    [null, 'all'],
  );
});

test('groupByMatchedNeeds: codes that were not selected, and repeats, do not count', () => {
  assert.deepStrictEqual(
    groupByMatchedNeeds(
      [{ matched_needs: ['N-MON-02', RENT, RENT] }],
      [RENT, FOOD],
    ),
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
  const changes = answerChanges(q, [RENT, 'U-3'], {
    needs: [],
    passedNeeds: [],
  });
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
  assert.deepStrictEqual(
    answerChanges(pass, ['N-MON-02'], { needs: [RENT], passedNeeds: [] }),
    {
      passed_needs: ['N-MON-02'],
    },
  );
  const time = question([
    { label: 'Today', parameter: 'urgency', value: 'U-1' },
    { label: 'Not urgent', parameter: 'urgency', value: 'U-3' },
  ]);
  assert.deepStrictEqual(
    answerChanges(time, [], { needs: [], passedNeeds: [] }),
    {
      urgency: 'U-X',
    },
  );
});

test('answerChanges: the emergency popup answers write U-0, U-1 and U-2 (Lucas 2026-11-18)', () => {
  const q = withEmergencyAnswers({
    ...question([]),
    id: 'emergency',
    type: 'emergency',
    importance: 'critical',
  });
  for (const code of ['U-0', 'U-1', 'U-2']) {
    assert.equal(
      answerChanges(q, [code], { needs: [], passedNeeds: [] }).urgency,
      code,
    );
  }
});

test('withEmergencyAnswers: exactly three options; the engine values win when all three match', () => {
  const base = {
    ...question([]),
    id: 'emergency',
    type: 'emergency' as const,
    importance: 'critical' as const,
  };
  const mine = withEmergencyAnswers(base);
  assert.deepStrictEqual(
    mine.options.map((o) => [o.label, o.value, o.parameter]),
    [
      ['Yes, I am in danger', 'U-0', 'urgency'],
      ['No, I am safe, I need help today', 'U-1', 'urgency'],
      ['No, I am safe, I need help this week', 'U-2', 'urgency'],
    ],
  );
  const engine = (label: string, value: string) => ({
    label,
    parameter: 'urgency' as const,
    value,
    results_count: null,
  });
  const theirs = withEmergencyAnswers({
    ...base,
    options: [
      engine('A', 'U-2'),
      engine('B', 'U-0'),
      engine('C', 'U-1'),
      engine('D', 'U-3'),
    ],
  });
  assert.deepStrictEqual(
    theirs.options.map((o) => o.label),
    ['B', 'C', 'A'],
  );
  // Older engine options (two answers, other codes): the page's own three.
  const old = withEmergencyAnswers({
    ...base,
    options: [engine('x', 'U-1'), engine('y', 'U-2')],
  });
  assert.equal(old.options[0].label, 'Yes, I am in danger');
});

test('emergencyPopupMode: by placement; ask, danger, or none', () => {
  const popup = {
    id: 'emergency',
    type: 'emergency' as const,
    placement: 'popup' as const,
  };
  assert.equal(emergencyPopupMode(popup, null, []), 'ask');
  assert.equal(emergencyPopupMode(popup, 'U-0', ['emergency']), 'danger');
  for (const u of ['U-1', 'U-2', 'U-3', 'U-4'])
    assert.equal(emergencyPopupMode(popup, u, ['emergency']), null);
  assert.equal(emergencyPopupMode(popup, null, ['emergency']), null);
  // Soft band: before_results is never a popup.
  assert.equal(
    emergencyPopupMode(
      { ...popup, placement: 'before_results', style: 'strong' },
      null,
      [],
    ),
    null,
  );
  // Legacy shape (no placement): critical -> popup, high -> soft.
  const legacy = { id: 'emergency', type: 'emergency' as const };
  assert.equal(
    emergencyPopupMode({ ...legacy, importance: 'critical' }, null, []),
    'ask',
  );
  assert.equal(
    emergencyPopupMode({ ...legacy, importance: 'high' }, null, []),
    null,
  );
  assert.equal(emergencyPopupMode(undefined, null, []), null);
});

test('emergencyQuestionOf reads the emergency only from the questions (Decision 54)', () => {
  const emergency = {
    ...question([]),
    id: 'emergency',
    type: 'emergency' as const,
    importance: 'critical' as const,
  };
  const response = {
    clarification: { rules_version: 'r', questions: [question([]), emergency] },
  } as unknown as V2Response;
  assert.equal(emergencyQuestionOf(response)?.importance, 'critical');
  // A legacy or new type name both count.
  const newType = { ...emergency, type: 'emergency' as const };
  assert.equal(canonicalType(newType.type), 'emergency');
  assert.equal(emergencyQuestionOf(undefined), undefined);
});

test('withoutNX: N-X is never sent in needs= (Decision 43: the route would answer 400)', async () => {
  const { withoutNX } =
    await import('../src/app/(app)/features/search/v2/v2-contract');
  assert.equal(withoutNX('N-HOU-02,N-X,N-FOD-01'), 'N-HOU-02,N-FOD-01');
  assert.equal(withoutNX('N-X'), null);
  assert.equal(withoutNX(null), null);
});

test('placementOf and styleOfQuestion: the API fields win; no importance read', () => {
  const q = {
    type: 'need' as const,
    placement: 'with_results' as const,
    style: 'subtle' as const,
    importance: 'critical' as const, // ignored when the new fields are there
  };
  assert.equal(placementOf(q), 'with_results');
  assert.equal(styleOfQuestion(q), 'subtle');
  assert.equal(placementOf({ type: 'emergency', placement: 'popup' }), 'popup');
  assert.equal(
    styleOfQuestion({
      type: 'urgency',
      placement: 'before_results',
      style: 'standard',
    }),
    'standard',
  );
});

test('placementOf and styleOfQuestion: legacy importance fallback', () => {
  const at = (
    type: V2Question['type'],
    importance: 'critical' | 'high' | 'medium' | 'low',
  ) => ({
    type,
    importance,
  });
  assert.equal(placementOf(at('find_need', 'critical')), 'popup');
  assert.equal(styleOfQuestion(at('find_need', 'critical')), 'strong');
  assert.equal(placementOf(at('find_need', 'high')), 'before_results');
  assert.equal(styleOfQuestion(at('find_need', 'high')), 'standard');
  assert.equal(placementOf(at('confirm_urgency', 'high')), 'before_results');
  for (const imp of ['medium', 'low'] as const) {
    assert.equal(placementOf(at('narrow', imp)), 'with_results');
    assert.equal(styleOfQuestion(at('narrow', imp)), 'subtle');
  }
  // Soft emergency band: high importance on the emergency question.
  assert.equal(placementOf(at('emergency', 'high')), 'before_results');
  assert.equal(styleOfQuestion(at('emergency', 'high')), 'strong');
});

test('canonicalType: legacy names count as the new ones', () => {
  assert.equal(canonicalType('emergency'), 'emergency');
  assert.equal(canonicalType('urgency'), 'urgency');
  assert.equal(canonicalType('confirm_urgency'), 'urgency');
  assert.equal(canonicalType('need'), 'need');
  assert.equal(canonicalType('find_need'), 'need');
  assert.equal(canonicalType('narrow'), 'need');
});

test('styleOf: red for the emergency type, else the question style', () => {
  assert.equal(styleOf({ type: 'emergency', style: 'strong' }), 'emergency');
  assert.equal(styleOf({ type: 'emergency', importance: 'low' }), 'emergency');
  assert.equal(
    styleOf({ type: 'need', placement: 'before_results', style: 'strong' }),
    'strong',
  );
  assert.equal(
    styleOf({ type: 'need', placement: 'before_results', style: 'standard' }),
    'standard',
  );
  assert.equal(
    styleOf({ type: 'urgency', placement: 'with_results', style: 'subtle' }),
    'subtle',
  );
  assert.equal(styleOf({ type: 'find_need', importance: 'high' }), 'standard');
  assert.equal(styleOf({ type: 'narrow', importance: 'low' }), 'subtle');
});

test('isSoftEmergency: soft = placement before_results; the popup is the full red one', () => {
  const e = { type: 'emergency' as const };
  assert.equal(isSoftEmergency({ ...e, placement: 'popup' }), false);
  assert.equal(isSoftEmergency({ ...e, placement: 'before_results' }), true);
  assert.equal(isSoftEmergency({ ...e, importance: 'critical' }), false);
  assert.equal(isSoftEmergency({ ...e, importance: 'high' }), true);
  assert.equal(isSoftEmergency(undefined), false);
});

test('nextQuestionOf routes by placement', () => {
  const mk = (id: string, placement: V2Placement) =>
    ({ ...question([]), id, type: 'need', placement }) as V2Question;
  const response = {
    clarification: {
      rules_version: 'r',
      questions: [mk('a', 'before_results'), mk('b', 'with_results')],
    },
  } as unknown as V2Response;
  assert.equal(nextQuestionOf(response, [], GUIDE_PLACEMENTS)?.id, 'a');
  assert.equal(nextQuestionOf(response, [], REFINE_PLACEMENTS)?.id, 'b');
});

test('stringsOf: words come from the API, English only when strings is absent', () => {
  const withStrings = {
    clarification: {
      rules_version: 'r',
      questions: [],
      strings: { popup_title: 'P', skip_to_results: 'S', also_fit_one: 'A' },
    },
  };
  assert.deepEqual(stringsOf(withStrings), {
    popupTitle: 'P',
    skipToResults: 'S',
    alsoFitOne: 'A',
  });
  assert.equal(stringsOf(undefined).skipToResults, 'Skip to results');
  assert.equal(stringsOf(undefined).alsoFitOne, 'Does this also fit?');
});

test('cardWording: the one-need wording comes from the API string', () => {
  const q = {
    stem: 'Do any of these also fit?',
    multi_select: true,
    options: [{ label: 'a', parameter: 'needs' as const, value: 'a' }],
  };
  assert.equal(cardWording(q, 'Passt das auch?').text, 'Passt das auch?');
  // A contract v2 stem is already the right words.
  assert.equal(cardWording({ ...q, stem: 'Fits too?' }, 'X').text, 'Fits too?');
});

test('cardWording: a one-need question is one tap, not "Pick all that fit"', () => {
  const opt = (value: string) => ({
    label: value,
    parameter: 'needs',
    value,
    results_count: null,
  });
  const none = {
    label: 'None',
    parameter: 'passed_needs',
    value: 'x',
    results_count: null,
  };
  assert.deepEqual(
    cardWording({
      stem: 'Do any of these also fit?',
      multi_select: true,
      options: [opt('N-SAF-04')],
    } as never),
    { text: 'Does this also fit?', multi: false },
  );
  assert.deepEqual(
    cardWording({
      stem: 'Which kind of help with Food & Water?',
      multi_select: true,
      options: [opt('N-FOD-01'), none],
    } as never),
    { text: 'Which kind of help with Food & Water?', multi: false },
  );
  assert.deepEqual(
    cardWording({
      stem: 'Do any of these also fit?',
      multi_select: true,
      options: [opt('a'), opt('b')],
    } as never),
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
  const changes = answerChanges(noMatch, ['N-FOD'], {
    needs: [],
    passedNeeds: [],
  });
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
  assert.equal(
    otherChanges(noMatch, null, 'a ride to dialysis', state).query,
    'a ride to dialysis',
  );
  assert.equal(
    otherChanges(noMatch, 'first', 'second', state).query,
    'first. second',
  );
});

test('Other text keeps the answers although the query text changes', () => {
  const state = { needs: ['N-FOD'], passedNeeds: ['N-HOU'], urgency: 'U-2' };
  const changes = otherChanges(noMatch, 'zzqx', 'rent help', state);
  const next = nextV2Params(
    new URLSearchParams(
      'query=zzqx&needs=N-FOD&passed_needs=N-HOU&urgency=U-2&asked=no_match',
    ),
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
  const changes = otherChanges(rent, 'rent', 'x', {
    needs: [],
    passedNeeds: [],
  });
  assert.equal(changes.query, 'rent. x');
  assert.deepStrictEqual(changes.passed_needs, ['N-FOD', 'N-HOU', 'N-MON']);
});

test('isWeakMatch and noMatchQuestionOf read the response', () => {
  const base = {
    clarification: { rules_version: 'r', questions: [noMatch] },
  } as unknown as V2Response;
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

test('countTone: null and absent draw nothing, 0 is red', () => {
  assert.equal(countTone(null), 'none');
  assert.equal(countTone(undefined), 'none');
  assert.equal(countTone(0), 'zero');
  assert.equal(countTone(12), 'some');
});

test('visibleOptions: None of these comes only from the flag; a legacy question still drops a fake one', () => {
  const opt = (n: number) => ({ label: `Need ${n}`, value: `N-${n}` });
  const many = Array.from({ length: 9 }, (_, i) => opt(i));
  const fake = { label: 'None of these', value: 'none' };
  const withNone = [...many, fake];
  // Legacy shape (no placement): the filter applies.
  const legacy = visibleOptions({}, withNone, true);
  assert.equal(legacy.shown.length, 9);
  // New shape: options are drawn as sent, no value filter.
  const fresh = visibleOptions({ placement: 'before_results' }, withNone, true);
  assert.equal(fresh.shown.length, 10);
  const first = visibleOptions({ placement: 'with_results' }, withNone, false);
  assert.equal(first.shown.length, OPTION_LIMIT);
  assert.equal(first.hidden, 10 - OPTION_LIMIT);
  assert.equal(
    visibleOptions({ placement: 'popup' }, many.slice(0, 3), false).hidden,
    0,
  );
  assert.equal(OPTION_LIMIT, 4);
  assert.ok(!isNoneOption({ label: 'Housing', value: 'N-HOU' }));
});

test('optionDescription gives the server text, and nothing for a missing or blank one', () => {
  assert.equal(
    optionDescription({
      description: " You don't have clean water to drink. ",
    }),
    "You don't have clean water to drink.",
  );
  assert.equal(optionDescription({}), undefined);
  assert.equal(optionDescription({ description: null }), undefined);
  assert.equal(optionDescription({ description: '   ' }), undefined);
});
