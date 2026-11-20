// A v1 tenant (`enableV2Api` off) sees no change in the six v1 files the v2 work edits
// (wa211-feature-inventory rows 1, 4, 7, 8, 14, 16). One test per file.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  showsSort,
  sortLabel,
  sortOptionValues,
} from '../src/app/(app)/features/search/utils/sort-options';

const APP = 'src/app/(app)/';
const read = (path: string) => readFileSync(`${APP}${path}`, 'utf8');

test('row 1+4, header.tsx: every v2 difference sits behind `v2`; v1 keeps left menu, own border, Quick exit in the menu', () => {
  const s = read('shared/components/header.tsx');
  assert.match(s, /const v2 = appConfig\.featureFlags\.enableV2Api;/);
  assert.match(s, /v2 && QUICK_EXIT_CLASSNAME/);
  assert.match(s, /v2 && 'border-b border-gray-200'/);
  assert.match(s, /side=\{v2 \? 'right' : 'left'\}/);
  assert.match(s, /const mobileSitemap = v2\s*\?/);
  assert.match(s, /!v2 && 'border-b'/);
});

test('row 7, hero-section.tsx: v1 keeps its sizes, animation, image and title style', () => {
  const s = read('features/home/components/hero-section.tsx');
  assert.match(s, /const v2 = appConfig\.featureFlags\.enableV2Api;/);
  assert.match(
    s,
    /v2 \? 'max-h-80 md:max-h-\[28rem\]' : 'max-h-64 md:max-h-96'/,
  );
  assert.match(
    s,
    /src=\{v2 \? \(heroSrc \?\? ''\) : \(appConfig\.heroUrl \?\? ''\)\}/,
  );
  assert.match(
    s,
    /: 'animate-in fade-in slide-in-from-bottom-2 max-w-\[31rem\] gap-2 p-3/,
  );
  assert.match(s, /v2 \? 'text-3xl md:text-4xl' : 'text-2xl tracking-tight'/);
});

test('row 8, search-bar.tsx: the hook split changes nothing for v1 (no maxWords, same options)', () => {
  const s = read('shared/components/search/search-bar.tsx');
  assert.match(s, /export function useSearchBarOptions/);
  assert.match(
    s,
    /const \{ options, isLoading \} = useSearchBarOptions\(searchTerm\);/,
  );
  // `maxWords` is the need box's only; the v1 bar never passes it.
  assert.doesNotMatch(
    s.slice(s.indexOf('export function SearchBar(')),
    /maxWords/,
  );
});

test('row 8, search-dialog.tsx: v1 keeps the SearchBar, its layout and scroll classes', () => {
  const s = read('shared/components/search/search-dialog.tsx');
  assert.match(s, /const v2 = appConfig\.featureFlags\.enableV2Api;/);
  assert.match(s, /\{v2 \? \(\s*<SearchNeedInput/);
  assert.match(s, /<SearchBar\s+inputId=\{SEARCH_INPUT_ID\}/);
  assert.match(s, /!v2 &&\s*'max-w-100 overflow-y-auto pt-6/);
  assert.match(s, /: 'overflow-y-auto'/);
});

test('row 14, results-section.tsx: v1 keeps Print, Share, its classes and no help item or radius select', () => {
  const s = read('features/search/components/results-section.tsx');
  assert.match(s, /const v2 = appConfig\.featureFlags\.enableV2Api;/);
  assert.match(s, /v2 && 'md:min-h-0 max-md:pb-24'/);
  assert.match(s, /\{v2 && <ResultsHelpItem \/>\}/);
  // The radius select and the always-on sort need a v2 query, and v1 has none (use-v2-search).
  assert.match(s, /\{Boolean\(v2Query\) && <RadiusSelect \/>\}/);
  const hook = read('features/search/v2/use-v2-search.ts');
  assert.match(hook, /const query = v2On \? urlQuery : '';/);
  assert.match(s, /<DirectoryPrintControl/);
  assert.match(s, /<ShareButton/);
});

test('row 16, sort-select.tsx + sort-options.ts: v1 keeps labels, order, hybrid rule and the 180px trigger', () => {
  assert.equal(showsSort({ queryType: 'hybrid', isV2: false }), false);
  assert.equal(showsSort({ queryType: 'keyword', isV2: false }), true);
  assert.deepEqual(
    sortOptionValues({
      isV2: false,
      showServiceName: true,
      hasCoordinates: true,
    }),
    ['relevance', 'name', 'organization', 'distance'],
  );
  assert.deepEqual(
    sortOptionValues({
      isV2: false,
      showServiceName: false,
      hasCoordinates: false,
    }),
    ['relevance', 'name'],
  );
  assert.equal(sortLabel('relevance', false), 'Most Relevant');
  assert.equal(sortLabel('name', false), 'Resource Name');
  assert.equal(sortLabel('organization', false), 'Provider Name');
  assert.equal(sortLabel('distance', false), 'Nearest First');
  const s = read('features/search/components/sort-select.tsx');
  assert.match(s, /isV2 \? 'w-auto min-w-\[180px\] gap-2' : 'w-\[180px\]'/);
  assert.match(s, /isV2 \? 'sort\.v2_options' : 'sort\.options'/);
});

test('v1 tenants dial and text as before: the no-dial switch needs the v2 flag', () => {
  const hook = read('shared/hooks/use-no-dial.ts');
  assert.match(hook, /NO_DIAL && v2 === true/);
  assert.match(read('shared/components/sms-button.tsx'), /if \(noDial\)/);
});
