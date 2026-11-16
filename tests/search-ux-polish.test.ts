// Prototype search UX polish (Lucas, 2026-11-14): no-dial safety, suggestions, the compact bar,
// the dropped progress label, and the results-page new-search fix.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildSearchUrl } from '../src/app/(app)/features/search/utils/buildSearchUrl';
import { EmergencyLine } from '../src/app/(app)/features/search/components/emergency-line';
import {
  DialButton,
  noDialNotice,
  PROTOTYPE_NO_DIAL,
} from '../src/app/(app)/features/search/components/no-dial';
import {
  DEFAULT_HOTLINES,
  EmergencyBox,
  HotlineNumbers,
} from '../src/app/(app)/features/search/components/search-follow-up';
import { SearchCrisisButton } from '../src/app/(app)/shared/components/search/search-need-form';
import { pickNeedSuggestions } from '../src/app/(app)/shared/components/search/need-suggestions';
import { nextV2Params } from '../src/app/(app)/features/search/v2/v2-contract';

const read = (path: string) => readFileSync(path, 'utf8');
const APP = 'src/app/(app)/';

// Item 8: safety. The switch is on, and no rendered emergency control has a tel: or sms: href.
test('no-dial: the switch is on and the notice names the number', () => {
  assert.equal(PROTOTYPE_NO_DIAL, true);
  assert.equal(
    noDialNotice('911'),
    'Test mode: no call placed (would call 911)',
  );
});

test('no-dial: every emergency control renders as a button with no tel: or sms: href', () => {
  const html = [
    renderToStaticMarkup(createElement(EmergencyLine)),
    renderToStaticMarkup(createElement(HotlineNumbers, {})),
    renderToStaticMarkup(createElement(HotlineNumbers, { soft: true })),
    renderToStaticMarkup(
      createElement(EmergencyBox, { hotlines: DEFAULT_HOTLINES }),
    ),
    renderToStaticMarkup(createElement(SearchCrisisButton)),
    renderToStaticMarkup(
      createElement(DialButton, { number: '211', children: 'Call 211' }),
    ),
  ].join('\n');
  assert.doesNotMatch(html, /href="(tel|sms):/i);
  assert.doesNotMatch(html, /tel:|sms:/i);
  assert.match(html, /data-no-dial="true"/);
  assert.match(html, /<button type="button"/);
  assert.match(html, /988/);
  assert.match(html, /911/);
});

// Item 3: suggestions.
test('suggestions: short phrases match, sentences and exact text do not, no duplicates', () => {
  const local = ['Food Banks', 'Getting Enough Food', 'Rent Help'];
  assert.deepEqual(
    pickNeedSuggestions('food', local, ['food banks', 'Food Pantry']),
    ['Food Banks', 'Getting Enough Food', 'Food Pantry'],
  );
  assert.deepEqual(pickNeedSuggestions('food banks', local), []);
  assert.deepEqual(pickNeedSuggestions('I need food for my kids', local), []);
  assert.deepEqual(pickNeedSuggestions('  ', local), []);
});

// Item 4: the progress label is gone, with every reference to it.
test('progress label: removed from the guide and the landing helpers', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.doesNotMatch(guide, /guide-progress|progressLabel/);
  assert.doesNotMatch(
    read(`${APP}features/search/v2/landing.ts`),
    /progressLabel/,
  );
});

test('skip: Skip this question sits in the same row as Show results now', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const row = guide.slice(guide.indexOf('canSkipQuestion && ('));
  assert.ok(
    row.indexOf('guide-skip-question') < row.indexOf('guide-see-results'),
  );
  assert.equal(guide.match(/data-testid="guide-skip-question"/g)?.length, 1);
});

// Item 2: the whole compact bar is one button.
test('compact bar: one button with an accessible name, whole bar clickable', () => {
  const landing = read(`${APP}features/search/components/search-landing.tsx`);
  const bar = landing.slice(
    landing.indexOf('{compact && ('),
    landing.indexOf('<form'),
  );
  assert.match(
    bar,
    /<button[\s\S]*aria-label=\{`Edit your search: \$\{query\}`\}/,
  );
  assert.match(
    bar,
    /onClick=\{\(\) => setEditing\(true\)\}[\s\S]*data-testid="landing-compact"/,
  );
  assert.match(bar, /w-full/);
});

// Item 7: a new search from the results page.
test('new search from the results page: no predicted taxonomy, no old answers', () => {
  const url = buildSearchUrl({
    query: 'need food for my kids tonight',
    searchEngine: 'v2' as never,
    skipLegacyLinkCheck: true,
  });
  assert.doesNotMatch(url, /taxonomy=/);
  for (const key of [
    'asked',
    'needs',
    'passed_needs',
    'urgency',
    'other',
    'refine',
  ]) {
    assert.doesNotMatch(url, new RegExp(`[?&]${key}=`));
  }
  // The inline box must not send predicted codes: they make the v2 call skip the area question.
  const box = read(`${APP}shared/components/search/search-inline-box.tsx`);
  assert.doesNotMatch(box, /predictSearchNeeds|taxonomies:/);
});

test('a changed query text drops the old answers from the v2 call', () => {
  const current = new URLSearchParams(
    'query=rent&needs=N-HOU-02&passed_needs=N-HOU-01&urgency=U-3&other=x&asked=emergency',
  );
  const next = nextV2Params(current, {
    query: 'need food for my kids tonight',
  });
  for (const key of ['needs', 'passed_needs', 'urgency']) {
    assert.equal(next.get(key), null, key);
  }
});

// Lucas 2026-11-16: after Enter the card does not change until the answer is known
// (no question-shaped skeleton, no buttons), then it shows a question or the results.
test('landing wait: one status line, no skeleton and no buttons before the first answer', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.match(guide, /const waiting = \(!data && !error\) \|\| finished;/);
  assert.doesNotMatch(guide, /\{!data && !error && <GuideSkeleton \/>\}/);
  assert.match(guide, /\{!waiting && \(canSkip \|\| canDeferLocation \|\| onPage\) && \(/);
  assert.match(guide, /\{data && \(showLocation \|\| \(card && !isEmergency\)\) && \(/);
});

// UX pass 2026-11-16: on a 390x700 phone the actions sat 211 px below the fold of the dialog.
test('guide actions: the row sticks to the bottom of the dialog and stays one row on a phone', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const row = guide.slice(guide.indexOf('(canSkip || canDeferLocation || onPage) && ('));
  assert.match(row.slice(0, 600), /sticky -bottom-5/);
  assert.match(row.slice(0, 600), /max-sm:flex-nowrap/);
  assert.match(row, /max-sm:sr-only">Skip this question/);
});

// UX pass 2026-11-16: Escape or Close on the landing left focus on <body> after going home.
test('landing close: focus goes to the home search box, after the path is home', () => {
  const landing = read(`${APP}features/search/components/search-landing.tsx`);
  assert.match(landing, /focusWhenReady\('\/', '\[data-testid="search-trigger"\]'\)/);
  assert.match(landing, /new URL\(document\.URL\)\.pathname === path/);
});

// Lucas 2026-11-06: on a phone a quiet question starts small; orange and red open.
test('refine card: quiet questions start collapsed on a phone only', () => {
  const src = read(`${APP}features/search/components/search-follow-up.tsx`);
  assert.match(src, /const quiet = !v2 \|\| QUESTION_STYLES\[styleOf\(v2\)\] === QUIET;/);
  assert.match(src, /if \(quiet && window\.matchMedia\(PHONE_QUERY\)\.matches\) \{\s*setCollapsed\(true\);/);
});

// Lucas 2026-11-13: "No, I am safe now" writes nothing to the URL; the page hides the question for the visit.
test('safe answer: no URL write, both pages hide the emergency question for the visit', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const card = read(`${APP}features/search/components/search-follow-up.tsx`);
  assert.equal(guide.match(/setSafeThisVisit\(true\);\s*return;/g)?.length, 2);
  assert.equal(card.match(/setSafeThisVisit\(true\);\s*return;/g)?.length, 1);
  assert.match(guide, /safeThisVisit && emergencyQ \? \[\.\.\.asked, emergencyQ\.id\] : asked/);
  assert.doesNotMatch(guide + card, /safeAnsweredInUrl/);
  // The v2 option has no value; the older card used U-3.
  assert.match(card, /answer\.add\.every\(\(v\) => v == null\)/);
});
