// UX round 2026-11-20: location step, Enter before load, Everywhere order, fixed header and bottom bar,
// loading hides the bar, results page fits the viewport, Quick exit color.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { enterAction } from '../src/app/(app)/shared/components/ui/autocomplete/enter-action';
import {
  everywhereFirst,
  firstPlaceIndex,
} from '../src/app/(app)/shared/hooks/api/use-locations';
import {
  MIN_PLACE_LOADING_MS,
  showBottomBar,
} from '../src/app/(app)/features/search/v2/guide-rules';
import { listMiddlewareNames } from '../src/app/(app)/shared/components/ui/autocomplete/placement';

const SRC = new URL('../src/app/(app)/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, SRC), 'utf8');

const GUIDE = 'shared/components/search/search-guide.tsx';
const LANDING_LOCATION = 'features/search/components/landing-location.tsx';

// ---- A. Location step ----

test('A: the "greatly improves" line is gone and the sentence shows only when a location is required', () => {
  const src = read(GUIDE);
  assert.doesNotMatch(src, /greatly improves/);
  assert.match(src, /requireLocation && \(\s*<p>/);
});

test('A: both v2 call sites ask for an inline button, an input-anchored list and a light gray border', () => {
  for (const file of [GUIDE, LANDING_LOCATION]) {
    const src = read(file);
    assert.match(src, /myLocationInline/, file);
    assert.match(src, /anchorList="input"/, file);
    assert.match(src, /listClassName="[^"]*border-gray-300/, file);
  }
});

test('A: the location bar and the button take the new opt-in props', () => {
  const bar = read('shared/components/search/location-search-bar.tsx');
  assert.match(bar, /myLocationInline\?: boolean/);
  assert.match(bar, /anchorList\?: 'form' \| 'input'/);
  assert.doesNotMatch(bar, /flipped above|flips above|flipped above/);
  const button = read('shared/components/search/use-my-location-button.tsx');
  assert.match(button, /className\?: string/);
});

test('A: placement "below" has no flip middleware, "auto" keeps it', () => {
  assert.deepEqual(listMiddlewareNames('auto'), [
    'offset',
    'flip',
    'shift',
    'size',
  ]);
  assert.deepEqual(listMiddlewareNames('below'), ['offset', 'shift', 'size']);
  const src = read('shared/components/ui/autocomplete/autocomplete.tsx');
  assert.match(src, /listMiddlewareNames\(placement\)/);
});

// ---- B. Enter before load, short loading after a pick, Everywhere order ----

test('B: Enter waits for the options only when asked to and while loading', () => {
  assert.equal(enterAction({ waitForOptions: true, loading: true }), 'wait');
  assert.equal(enterAction({ waitForOptions: true, loading: false }), 'commit');
  assert.equal(enterAction({ waitForOptions: false, loading: true }), 'commit');
  assert.equal(
    enterAction({ waitForOptions: false, loading: false }),
    'commit',
  );
});

test('B: Everywhere is first for an empty box, a prefix of the word, or no match', () => {
  assert.equal(everywhereFirst('', 0, 'Everywhere'), true);
  assert.equal(everywhereFirst('Syr', 3, 'Everywhere'), false);
  assert.equal(everywhereFirst('ev', 3, 'Everywhere'), true);
  assert.equal(everywhereFirst('EV', 3, 'Everywhere'), true);
  assert.equal(everywhereFirst('Everywhere', 5, 'Everywhere'), true);
  assert.equal(everywhereFirst('Syracuse', 0, 'Everywhere'), true);
  assert.equal(everywhereFirst('  ', 4, 'Everywhere'), true);
});

test('B: the first real place is at index 0 when Everywhere is last, 1 when it is first', () => {
  assert.equal(firstPlaceIndex(true), 1);
  assert.equal(firstPlaceIndex(false), 0);
});

test('B: the guide advances only on a real pick, after a minimum loading time', () => {
  const src = read(GUIDE);
  assert.match(src, /isPickedPlace\(/);
  assert.match(src, /searchRegionAtom/);
  assert.match(src, /MIN_PLACE_LOADING_MS/);
  assert.match(src, /clearTimeout/);
  assert.equal(MIN_PLACE_LOADING_MS, 800);
  const bar = read('shared/components/search/location-search-bar.tsx');
  assert.match(bar, /commitAfterLoad/);
  assert.match(bar, /rankEverywhere/);
  for (const file of [GUIDE, LANDING_LOCATION]) {
    const src = read(file);
    assert.match(src, /commitAfterLoad/, file);
    assert.match(src, /rankEverywhere/, file);
  }
});

// ---- D. Loading hides the bottom buttons ----

test('D: the bottom bar hides while waiting, loading or saving a place', () => {
  const on = {
    waiting: false,
    showBar: true,
    isPending: false,
    placeSaving: false,
  };
  assert.equal(showBottomBar(on), true);
  assert.equal(showBottomBar({ ...on, waiting: true }), false);
  assert.equal(showBottomBar({ ...on, showBar: false }), false);
  assert.equal(showBottomBar({ ...on, isPending: true }), false);
  assert.equal(showBottomBar({ ...on, placeSaving: true }), false);
  assert.match(read(GUIDE), /showBottomBar\(\{/);
});

// ---- C. Fixed header and bottom bar, only the middle scrolls ----

test('C: /find asks the card for inner scrolling; the card then hides overflow instead of scrolling', () => {
  assert.match(
    read('features/search/components/search-landing.tsx'),
    /<GuideShell[\s\S]*?\n\s+innerScroll\n/,
  );
  const guide = read(GUIDE);
  const outer = guide.match(/const CARD_SCROLL_CLASS =\s*'([^']*)'/)?.[1] ?? '';
  const inner =
    guide.match(/const CARD_INNER_SCROLL_CLASS =\s*'([^']*)'/)?.[1] ?? '';
  assert.match(outer, /overflow-y-auto/);
  assert.match(inner, /overflow-hidden/);
  assert.doesNotMatch(inner, /overflow-y-auto/);
  assert.match(
    guide,
    /innerScroll \? CARD_INNER_SCROLL_CLASS : CARD_SCROLL_CLASS/,
  );
});

test('C: on the page the questions scroll in their own region and the bottom bar stays below it', () => {
  const guide = read(GUIDE);
  assert.match(guide, /data-testid="guide-scroll"/);
  const region =
    guide.match(/className="([^"]*)"\s+data-testid="guide-scroll"/)?.[1] ?? '';
  assert.match(region, /overflow-y-auto/);
  assert.match(region, /min-h-0 flex-1/);
  assert.match(guide, /onPage\s*\?\s*'shrink-0/);
});

test('C: the landing header no longer pins itself with the sticky hack', () => {
  const landing = read('features/search/components/search-landing.tsx');
  assert.doesNotMatch(landing, /max-sm:sticky/);
  assert.match(landing, /data-testid="landing-popup"/);
  assert.match(landing, /min-h-0 flex-1 flex-col gap-4/);
});

// ---- E. Results page, desktop: only the results list scrolls ----

test('E: the search page fits the viewport on md and up; the footer steps aside there', () => {
  assert.match(
    read('[locale]/(rest)/search/page.tsx'),
    /<PageWrapper[\s\S]*?\n\s+fitViewport\n/,
  );
  const wrapper = read('shared/components/page-wrapper.tsx');
  assert.match(wrapper, /fitViewport\?: boolean/);
  assert.match(wrapper, /md:h-dvh md:overflow-hidden/);
  assert.match(wrapper, /fitViewport && 'md:hidden'/);
  const shell = read('features/search/components/search-page-shell.tsx');
  assert.match(shell, /h-full min-h-0 w-full flex-col/);
  assert.match(
    read('features/search/components/filter/filter-panel.tsx'),
    /md:overflow-y-auto/,
  );
  assert.match(
    read('features/search/components/results-section.tsx'),
    /md:min-h-0/,
  );
});

// ---- F. Top bar: Quick exit color ----

test('F: the header Quick exit and the floating one share one red class constant', () => {
  const button = read('shared/components/quick-exit-button.tsx');
  assert.match(button, /export const QUICK_EXIT_CLASSNAME =/);
  assert.match(button, /bg-red-700/);
  assert.match(button, /cn\([\s\S]*QUICK_EXIT_CLASSNAME/);
  assert.match(read('shared/components/header.tsx'), /QUICK_EXIT_CLASSNAME/);
});

// ---- Item 8: place row on question screens ----

test('Item 8: the place row has Change but no Clear button', () => {
  const src = read(LANDING_LOCATION);
  assert.doesNotMatch(src, /landing-location-clear/);
  assert.doesNotMatch(src, /clearLocationCookies/);
  assert.match(src, /landing-location-change/);
});
