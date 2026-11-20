// Prototype: the landing page before the results page (Lucas, 2026-11-13). The pure rules:
// which links skip it, what URL the results page gets, and which step the landing page shows.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  isDirectResultsLink,
  landingStep,
  resultsUrlFor,
  toLandingUrl,
  isResultsPath,
  landingLocationLabel,
  locationChanges,
  isPickedPlace,
  CLEAR_LOCATION_CHANGES,
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

test('a typed search always asks: toLandingUrl adds refine=1 to a query without it, and leaves a given refine alone', () => {
  assert.equal(toLandingUrl('/search?query=food'), '/find?query=food&refine=1');
  assert.equal(
    toLandingUrl('/search?query=food&refine=0'),
    '/find?query=food&refine=0',
  );
  assert.equal(
    toLandingUrl('/search?location=Seattle'),
    '/find?location=Seattle',
  );
});

// Lucas 2026-11-20: a search typed on /search stays on /search.
test('isResultsPath: the results page, with or without a locale prefix', () => {
  for (const yes of ['/search', '/search/', '/en/search', '/es/search/']) {
    assert.equal(isResultsPath(yes), true, yes);
  }
  for (const no of ['/', '/find', '/en/find', '/resource/x', '/searching']) {
    assert.equal(isResultsPath(no), false, no);
  }
  assert.equal(isResultsPath(null), false);
  assert.equal(isResultsPath(undefined), false);
});

const SRC = new URL('../src/app/(app)/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, SRC), 'utf8');

test('search typed on /search stays there: no landing from the inline box, the hook checks the path', () => {
  const box = read('shared/components/search/search-inline-box.tsx');
  assert.doesNotMatch(box, /landing:/);
  assert.doesNotMatch(box, /opensLandingFromBar/);
  assert.match(
    read('features/search/hooks/useNavigateAiSearch.ts'),
    /isResultsPath\(/,
  );
});

test('landingLocationLabel: text, or null for empty and Everywhere', () => {
  assert.equal(landingLocationLabel(''), null);
  assert.equal(landingLocationLabel('  '), null);
  assert.equal(landingLocationLabel(null), null);
  assert.equal(landingLocationLabel('Everywhere'), null);
  assert.equal(landingLocationLabel('everywhere'), null);
  assert.equal(
    landingLocationLabel(' Rochester, New York '),
    'Rochester, New York',
  );
});

test('CLEAR_LOCATION_CHANGES leaves the query and no location keys', () => {
  const next = nextV2Params(
    new URLSearchParams(
      'query=food&location=X&coords=1,2&region=r1&distance=10&area_match=a',
    ),
    CLEAR_LOCATION_CHANGES,
  );
  assert.equal(next.get('query'), 'food');
  for (const key of [
    'location',
    'coords',
    'region',
    'distance',
    'area_match',
  ]) {
    assert.equal(next.has(key), false, key);
  }
});

test('locationChanges: location, coords as lon,lat, region or null', () => {
  assert.deepEqual(locationChanges('Rochester', [-77.6, 43.1], ''), {
    location: 'Rochester',
    coords: '-77.6,43.1',
    region: null,
  });
  assert.equal(locationChanges('X', [], 'r1').coords, null);
  assert.equal(locationChanges('X', '1,2', 'r1').coords, '1,2');
  assert.equal(locationChanges('X', '1,2', 'r1').region, 'r1');
});

test('the landing page renders the location row', () => {
  assert.match(
    read('features/search/components/search-landing.tsx'),
    /<LandingLocation/,
  );
});

// Regression (live walk 2026-11-20): typing over the shown place on /find wrote the first letter as the
// location, because the box writes typed letters to searchLocation with no coordinates.
test('isPickedPlace: only a place with a point or an area is a pick', () => {
  assert.equal(isPickedPlace([], ''), false);
  assert.equal(isPickedPlace(undefined, null), false);
  assert.equal(isPickedPlace('', ''), false);
  assert.equal(isPickedPlace([-77.6, 43.1], ''), true);
  assert.equal(isPickedPlace([], 'region-1'), true);
});

test('the /find location row writes only a picked place', () => {
  const src = read('features/search/components/landing-location.tsx');
  assert.match(src, /isPickedPlace\(searchCoordinates, searchRegion\)/);
  assert.doesNotMatch(src, /else if \(searchLocation\.trim\(\)\)/);
});

// Regression (David 2026-11-19, live walk 2026-11-20): on /find the location box had no
// MainSearchLayoutContext, so typing a place never geocoded (only "Everywhere" was offered).
test('the landing page provides the search layout context to its location boxes', () => {
  const src = read('features/search/components/search-landing.tsx');
  assert.match(src, /<MainSearchLayoutContextProvider>/);
  assert.match(src, /<\/MainSearchLayoutContextProvider>/);
});

// Regression (live walk 2026-11-20, 390 px): the place list flipped above the input and slid under the
// pinned landing header (z-20), so 'Syracuse, New York' could not be tapped. Both /find boxes lift it.
test('the /find location boxes lift their suggestion list above the pinned header', () => {
  const header = read('features/search/components/search-landing.tsx').match(
    /className="([^"]*)"\s*data-testid="landing-header"/,
  )?.[1];
  assert.match(header ?? '', /max-sm:z-20/);
  assert.match(
    read('shared/components/search/search-guide.tsx'),
    /<LocationSearchBar\s+inputId=\{LOCATION_INPUT_ID\}\s+listClassName="z-30"/,
  );
  assert.match(
    read('features/search/components/landing-location.tsx'),
    /listClassName="z-30"/,
  );
  assert.match(
    read('shared/components/search/location-search-bar.tsx'),
    /props\.listClassName/,
  );
});
