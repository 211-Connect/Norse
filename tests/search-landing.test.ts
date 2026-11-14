// Prototype: the landing page before the results page (Lucas, 2026-11-13). The pure rules:
// which links skip it, what URL the results page gets, and which step the landing page shows.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isDirectResultsLink,
  landingStep,
  progressLabel,
  resultsUrlFor,
  toLandingUrl,
} from '../src/app/(app)/features/search/v2/landing';
import {
  answerChanges,
  nextV2Params,
  type V2Question,
} from '../src/app/(app)/features/search/v2/v2-contract';

const RENT = 'N-HOU-02';
const question: V2Question = {
  id: 'narrow:N-HOU',
  type: 'narrow',
  importance: 'high',
  reason: 'test',
  stem: 'What kind of housing help?',
  options: [
    { label: 'Rent', parameter: 'needs', value: RENT },
    { label: 'Shelter', parameter: 'needs', value: 'N-HOU-01' },
  ],
  multi_select: true,
  allow_other: false,
  none_of_these: true,
};

const asParams = (search: string) => new URLSearchParams(search);

test('landing: a bare query, needs and urgency stay on the landing page', () => {
  assert.equal(isDirectResultsLink(asParams('query=help+with+rent')), false);
  assert.equal(
    isDirectResultsLink(asParams('query=rent&needs=N-HOU-02')),
    false,
  );
  assert.equal(isDirectResultsLink(asParams('')), false);
});

test('direct link: a taxonomy or an organization goes straight to the results', () => {
  assert.equal(
    isDirectResultsLink(asParams('query=rent&taxonomy=BH-1800')),
    true,
  );
  assert.equal(isDirectResultsLink(asParams('organization_id=abc123')), true);
  assert.equal(isDirectResultsLink(asParams('taxonomy=%20')), false);
});

test('direct link without a query: a taxonomy or needs alone goes straight to the results', () => {
  assert.equal(isDirectResultsLink(asParams('taxonomy=BH-3800.7000')), true);
  assert.equal(isDirectResultsLink(asParams('needs=N-HOU-02')), true);
  assert.equal(
    isDirectResultsLink(asParams('needs=N-HOU-02&urgency=U-3')),
    true,
  );
  assert.equal(isDirectResultsLink(asParams('needs=%20')), false);
});

test('landing step: box, loading, location, question, then results', () => {
  const base = {
    query: 'rent',
    hasData: true,
    showLocation: false,
    hasQuestion: true,
  };
  assert.equal(landingStep({ ...base, query: '' }), 'box');
  assert.equal(landingStep({ ...base, hasData: false }), 'loading');
  assert.equal(landingStep({ ...base, showLocation: true }), 'location');
  assert.equal(landingStep(base), 'question');
  // Zero questions, or all answered or skipped: the person goes to the results.
  assert.equal(landingStep({ ...base, hasQuestion: false }), 'results');
});

test('answer: each answer is a new URL step on the landing page, answers carried in the URL', () => {
  const start = asParams('query=help+with+rent');
  const answered = nextV2Params(start, {
    asked: [question.id],
    ...answerChanges(question, [RENT], { needs: [], passedNeeds: [] }),
  });
  assert.equal(answered.get('needs'), RENT);
  assert.equal(answered.get('passed_needs'), 'N-HOU-01');
  assert.equal(answered.get('asked'), question.id);
  assert.notEqual(answered.toString(), start.toString());
});

test('skip: no pick marks the offered needs as passed and still moves on', () => {
  const skipped = nextV2Params(asParams('query=rent'), {
    asked: [question.id],
    ...answerChanges(question, [], { needs: [], passedNeeds: [] }),
  });
  assert.equal(skipped.get('needs'), null);
  assert.equal(skipped.get('passed_needs'), `${RENT},N-HOU-01`);
  assert.equal(skipped.get('asked'), question.id);
});

test('Back: removing the last answer from the history step gives the earlier URL', () => {
  const first = asParams('query=rent');
  const second = nextV2Params(first, { asked: ['a'] });
  const third = nextV2Params(second, { asked: ['a', 'b'] });
  // The browser's Back goes from the third URL to the second: one answer undone.
  assert.equal(third.get('asked'), 'a,b');
  assert.equal(second.get('asked'), 'a');
  assert.equal(first.get('asked'), null);
});

test('go to results: answers stay, refine goes, the legacy gate is skipped', () => {
  const url = resultsUrlFor(
    'query=help+with+rent&needs=N-HOU-02&passed_needs=N-HOU-01&urgency=U-2&asked=narrow%3AN-HOU&refine=1',
    'classic',
  );
  const [path, search] = url.split('?');
  assert.equal(path, '/search');
  const out = new URLSearchParams(search);
  assert.equal(out.get('query'), 'help with rent');
  assert.equal(out.get('needs'), 'N-HOU-02');
  assert.equal(out.get('passed_needs'), 'N-HOU-01');
  assert.equal(out.get('urgency'), 'U-2');
  assert.equal(out.get('asked'), 'narrow:N-HOU');
  assert.equal(out.get('refine'), null);
  assert.equal(out.get('sllc'), '1');
});

test('go to results with no answers (zero questions or Show results at once): a plain query URL', () => {
  const [path, search] = resultsUrlFor('query=food', 'classic').split('?');
  assert.equal(path, '/search');
  const out = new URLSearchParams(search);
  assert.equal(out.get('query'), 'food');
  assert.equal(out.get('needs'), null);
});

test('the home search dialog hands its URL to the landing page, same query string', () => {
  assert.equal(
    toLandingUrl('/search?query=rent&sllc=1&refine=1'),
    '/find?query=rent&sllc=1&refine=1',
  );
  assert.equal(toLandingUrl('/search'), '/find');
});

test('progress: names the cap, not an exact count', () => {
  assert.equal(progressLabel(0), 'Question 1 of up to 3');
  assert.equal(progressLabel(1), 'Question 2 of up to 3');
});
