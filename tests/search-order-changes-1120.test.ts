// Order changes 2026-11-20 (Lucas) on PR #1222 (v2 search page): /find never shows results,
// Use my location in line with the box, the place list height, the /find menu, the location x,
// the header outline, and no Back right after the location or crisis question.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  canGoBackFrom,
  keepsGuideOpen,
} from '../src/app/(app)/features/search/v2/guide-rules';
import { everywhereFirst } from '../src/app/(app)/shared/hooks/api/use-locations';

const SRC = new URL('../src/app/(app)/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, SRC), 'utf8');

const FIND_PAGE = '[locale]/(home)/find/page.tsx';
const LOCATION_BAR = 'shared/components/search/location-search-bar.tsx';
const AUTOCOMPLETE = 'shared/components/ui/autocomplete/autocomplete.tsx';
const HEADER = 'shared/components/header.tsx';
const GUIDE = 'shared/components/search/search-guide.tsx';

// ---- /find never shows results ----

test('/find: the server results view (SeoResults) is gone', () => {
  const src = read(FIND_PAGE);
  assert.doesNotMatch(src, /SeoResults|fetchV2Server|showsResultsView/);
  assert.equal(
    existsSync(new URL('features/search/components/seo-results.tsx', SRC)),
    false,
  );
});

test('/find: a typed query without refine=1 opens the questions (adds refine=1)', () => {
  const src = read(FIND_PAGE);
  assert.match(
    src,
    /search\.get\('query'\)\?\.trim\(\) && !search\.has\('refine'\)/,
  );
  assert.match(src, /withRefine\.set\('refine', '1'\)/);
  assert.match(src, /redirect\(`\/find\?\$\{withRefine\}`\)/);
});

// ---- Everywhere rule (order: empty, text starts like "Everywhere", or no match) ----

test('Everywhere is first only for an empty box, an "ev" start, or no match', () => {
  assert.equal(everywhereFirst('', 5, 'Everywhere'), true);
  assert.equal(everywhereFirst('ev', 3, 'Everywhere'), true);
  assert.equal(everywhereFirst('Syracuse', 0, 'Everywhere'), true);
  assert.equal(everywhereFirst('Syracuse', 5, 'Everywhere'), false);
  assert.equal(everywhereFirst('Lincoln County', 8, 'Everywhere'), false);
});

// ---- Use my location ----

test('Use my location: same line and same height as the box, hidden once there is text', () => {
  const src = read(LOCATION_BAR);
  assert.match(src, /flex flex-row flex-wrap items-start gap-2/);
  assert.match(src, /UseMyLocationButton className="h-\[34px\] min-h-0/);
  assert.doesNotMatch(src, /UseMyLocationButton className="min-h-11/);
  assert.match(src, /showInlineMyLocation = inline && !shownText\.trim\(\)/);
});

// ---- Location x ----

test('location x on v2: empties the box only, no Everywhere commit, no "Remove" tooltip', () => {
  const bar = read(LOCATION_BAR);
  assert.match(bar, /clearOnlyEmpties = rankEverywhere && !isStandalone/);
  assert.match(
    bar,
    /if \(clearOnlyEmpties\) \{\s*handleDecommit\(''\);\s*return;/,
  );
  assert.match(bar, /clearButtonTooltip=\{!clearOnlyEmpties\}/);
  const auto = read(AUTOCOMPLETE);
  assert.match(auto, /hasText && !clearButtonTooltip && \(/);
  assert.match(auto, /hasText && clearButtonTooltip && \(/);
});

// ---- /find menu ----

const fakeTarget = (matches: string[]) => ({
  closest: (selector: string) =>
    selector
      .split(',')
      .map((part) => part.trim())
      .some((part) => matches.includes(part))
      ? {}
      : null,
});

test('/find menu: the header and the menu panel keep the questions open', () => {
  assert.equal(keepsGuideOpen(fakeTarget(['header']) as never), true);
  assert.equal(keepsGuideOpen(fakeTarget(['[role="dialog"]']) as never), true);
  assert.equal(
    keepsGuideOpen(fakeTarget(['[data-slot="sheet-overlay"]']) as never),
    true,
  );
  assert.equal(keepsGuideOpen(fakeTarget([]) as never), false);
  assert.equal(keepsGuideOpen(null), false);
  assert.match(
    read(GUIDE),
    /onInteractOutside=\{\(event\) => \{\s*if \(keepsGuideOpen\(event\.target\)\) event\.preventDefault\(\);/,
  );
});

test('/find menu: panel on the right, Quick exit listed once', () => {
  const src = read(HEADER);
  assert.match(src, /<SheetContent side=\{v2 \? 'right' : 'left'\}>/);
  assert.match(src, /\{mobileSitemap\}/);
  assert.match(src, /key !== SAFE_EXIT_KEY/);
  assert.match(src, /<li key=\{SAFE_EXIT_KEY\}>/);
});

// ---- Header outline ----

test('header: a light gray bottom outline on every width and layout', () => {
  assert.match(read(HEADER), /v2 && 'border-b border-gray-200'/);
  assert.match(
    read(GUIDE),
    /h-\[3\.25rem\] border-b border-gray-200 bg-white sm:hidden/,
  );
});

// ---- Back ----

const back = (asked: string[], lastBackIdx = asked.length - 1) =>
  canGoBackFrom({
    onPage: true,
    asked,
    lastBackIdx,
    locationStep: 'location',
    emergencyId: 'emergency',
  });

test('Back: none right after the location question or the crisis question', () => {
  assert.equal(back(['q1', 'location']), false);
  assert.equal(back(['q1', 'emergency'], 0), false);
  assert.equal(back(['location', 'q1']), true);
  assert.equal(back(['emergency', 'q1']), true);
  assert.equal(back([], -1), false);
  assert.equal(
    canGoBackFrom({
      onPage: false,
      asked: ['q1', 'q2'],
      lastBackIdx: 1,
      locationStep: 'location',
      emergencyId: 'emergency',
    }),
    false,
  );
});

// ---- Place list height ----

import {
  belowListMaxHeight,
  LIST_MAX_HEIGHT_PX,
  LIST_MIN_HEIGHT_PX,
} from '../src/app/(app)/shared/components/ui/autocomplete/placement';

test('place list: taller, capped, and fits above the keyboard', () => {
  // Desktop, lots of room: the cap (about 9 places), so a long list scrolls inside the list.
  assert.equal(belowListMaxHeight(1000, 300), LIST_MAX_HEIGHT_PX);
  // Phone with the keyboard up: the visible part is short, the list fits in it.
  assert.equal(belowListMaxHeight(450, 200), 154);
  // Never shorter than about 3 places.
  assert.equal(belowListMaxHeight(400, 380), LIST_MIN_HEIGHT_PX);
  const src = read(AUTOCOMPLETE);
  assert.match(
    src,
    /inFlowList = placement === 'below' && !positionBelowElementId/,
  );
  assert.match(src, /window\.visualViewport\?\.height/);
  // Inside a scroll region (the questions card), the list stops where the region can reach,
  // so the card itself never scrolls for it.
  assert.equal(belowListMaxHeight(590, 369, 16), 205);
  assert.match(src, /scrollRegionMaxBottom\(input\)/);
  assert.match(
    src,
    /floatingRefs\.setFloating\(inFlowList \? null : element\)/,
  );
});

test('location x: leaving the emptied box does not put the old place back', () => {
  const src = read('shared/components/ui/autocomplete/use-autocomplete.ts');
  assert.match(
    src,
    /autoSelectOnBlurIndex != null &&[\s\S]{0,80}!\(skipBlurPickWhenEmpty && inputText\.trim\(\) === ''\)/,
  );
});
