import assert from 'node:assert/strict';
import test from 'node:test';

import { asksLocationStep } from '../src/app/(app)/features/search/v2/guide-rules';
import { pinsCallEnabled } from '../src/app/(app)/features/search/v2/v2-pins';
import {
  radiusHref,
  showsRadiusSelect,
} from '../src/app/(app)/features/search/utils/radius';
import {
  DEFAULT_NEED_PLACEHOLDER,
  DEFAULT_NEED_TITLE,
  needBoxTexts,
} from '../src/app/(app)/shared/components/search/need-texts';
import { readFileSync } from 'node:fs';

// Q1: the v2 need box uses the v1 search bar's options (tenant headings, taxonomy badges,
// organization rows) in the v1 list; no copy of them lives in the v2 box.
test('need box shows the v1 groups through the v1 option builder and list', () => {
  const dir = 'src/app/(app)/shared/components/search/';
  const box = readFileSync(`${dir}need-box.tsx`, 'utf8');
  const bar = readFileSync(`${dir}search-bar.tsx`, 'utf8');
  assert.match(box, /useSearchBarOptions/);
  assert.match(box, /AutocompleteListbox/);
  assert.doesNotMatch(box, /groupNeedSuggestions|pickNeedSuggestionItems/);
  for (const flag of [
    'showSuggestionListTaxonomyBadge',
    'enableOrganizationSearch',
    'showOrganizationLocationBadge',
    'suggestionHeaders',
  ]) {
    assert.match(bar, new RegExp(flag), flag);
  }
});

// Q2: v2 default texts, tenant text wins
test('need box uses the v2 defaults when the tenant fields are empty', () => {
  for (const texts of [
    undefined,
    {},
    { title: '  ', queryInputPlaceholder: '' },
  ]) {
    assert.deepEqual(needBoxTexts(texts), {
      title: DEFAULT_NEED_TITLE,
      placeholder: DEFAULT_NEED_PLACEHOLDER,
    });
  }
  assert.equal(DEFAULT_NEED_TITLE, 'What do you need help with?');
  assert.equal(
    DEFAULT_NEED_PLACEHOLDER,
    'For example: I think I will run out of food this week.',
  );
});

test('need box tenant text wins over the v2 default, field by field', () => {
  assert.deepEqual(
    needBoxTexts({
      title: 'How can we help?',
      queryInputPlaceholder: 'Food, clothing',
    }),
    { title: 'How can we help?', placeholder: 'Food, clothing' },
  );
  assert.deepEqual(needBoxTexts({ title: 'How can we help?' }), {
    title: 'How can we help?',
    placeholder: DEFAULT_NEED_PLACEHOLDER,
  });
});

// Q3: map pins follow showAllResultsOnMap
test('pins call runs only when the tenant shows all results on the map', () => {
  const base = { query: 'food', tenantId: 't1' };
  assert.equal(pinsCallEnabled({ ...base, showAllResultsOnMap: true }), true);
  assert.equal(pinsCallEnabled({ ...base, showAllResultsOnMap: false }), false);
  assert.equal(
    pinsCallEnabled({ query: '', tenantId: 't1', showAllResultsOnMap: true }),
    false,
  );
  assert.equal(
    pinsCallEnabled({
      query: 'food',
      tenantId: undefined,
      showAllResultsOnMap: true,
    }),
    false,
  );
});

// Q4: require a place; radius on address searches
const step = {
  locationDone: false,
  isEmergency: false,
  used: 0,
  onPage: false,
  hasQuestions: false,
  requireLocation: false,
};

test('with requireUserLocation on, a search with no question still asks for a place', () => {
  assert.equal(asksLocationStep({ ...step, onPage: true }), false);
  assert.equal(
    asksLocationStep({ ...step, onPage: true, requireLocation: true }),
    true,
  );
});

test('a place already given and the emergency question never ask', () => {
  const on = { ...step, onPage: true, requireLocation: true };
  assert.equal(asksLocationStep({ ...on, locationDone: true }), false);
  assert.equal(asksLocationStep({ ...on, isEmergency: true }), false);
  // No client-side limit: the API caps before_results questions (contract v2).
  assert.equal(asksLocationStep({ ...on, used: 3 }), true);
});

test('tenants without requireUserLocation keep the old rule', () => {
  assert.equal(asksLocationStep({ ...step, onPage: false }), true);
  assert.equal(
    asksLocationStep({ ...step, onPage: true, hasQuestions: true }),
    true,
  );
  assert.equal(asksLocationStep({ ...step, onPage: true, used: 1 }), true);
});

test('radius dropdown: address search with tenant values only', () => {
  const radiusValues = [{ value: 5 }, { value: 10 }];
  assert.equal(
    showsRadiusSelect({ radiusValues, hasCoordinates: true, region: null }),
    true,
  );
  assert.equal(
    showsRadiusSelect({ radiusValues, hasCoordinates: true, region: 'r1' }),
    false,
  );
  assert.equal(
    showsRadiusSelect({ radiusValues, hasCoordinates: false, region: null }),
    false,
  );
  assert.equal(
    showsRadiusSelect({ radiusValues: [], hasCoordinates: true, region: null }),
    false,
  );
  assert.equal(
    showsRadiusSelect({
      radiusValues: undefined,
      hasCoordinates: true,
      region: null,
    }),
    false,
  );
});

test('radiusHref sets distance and returns to page 1', () => {
  const href = radiusHref(
    '/search',
    new URLSearchParams('query=food&page=3&distance=5'),
    '10',
  );
  const params = new URL(href, 'http://x').searchParams;
  assert.equal(params.get('distance'), '10');
  assert.equal(params.get('page'), null);
  assert.equal(params.get('query'), 'food');
});
