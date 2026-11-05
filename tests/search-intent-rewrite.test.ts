// The writers that edit the URL the visitor is on (filter navigation, the coords redirect) go through the
// serializer: lift, change, serialize. ISS-2409 is why: they used to re-serialise the raw parameters, and
// a repeated plain key came out as key[0]=…&key[1]=…, which the page reads as nothing.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  liftQueryString,
  liftSearchParams,
  rawSearchParams,
  rewriteSearchUrl,
  UNSTATED,
  type SearchIntent,
} from '../src/app/(app)/features/search/intent';

import { ALL_FIXTURES } from './search-intent-fixtures';

/** What the filter navigation writes for a change, from a query string. */
const filterClick = (
  query: string,
  change: (i: SearchIntent) => SearchIntent,
) => rewriteSearchUrl(rawSearchParams(query), change, { newSearch: true });

const addFilter = (intent: SearchIntent): SearchIntent => ({
  ...intent,
  filters: { stated: true, value: { payment: ['Free'] } },
});
const clearFilters = (intent: SearchIntent): SearchIntent => ({
  ...intent,
  filters: UNSTATED,
});

const REPEATED =
  'query=food&query_label=Food&query_label=Food+bank&query_type=text&query_type=hybrid' +
  '&location=Seattle&location=Tacoma&coords=-122.3,47.6&coords=-122.4,47.5&page=3';

test('a filter click on a URL with a repeated location keeps one location and the coords', () => {
  const url = filterClick(REPEATED, addFilter);
  assert.equal(
    url,
    '/search?query=food&query_label=Food&query_type=text&location=Seattle' +
      '&coords=-122.3%2C47.6&filters%5Bpayment%5D%5B0%5D=Free',
  );
  const { intent } = liftQueryString(url.replace('/search?', ''));
  assert.deepStrictEqual(intent.location, { stated: true, value: 'Seattle' });
  assert.deepStrictEqual(intent.coords, {
    stated: true,
    value: [-122.3, 47.6],
  });
  assert.deepStrictEqual(intent.queryLabel, { stated: true, value: 'Food' });
});

test('a filter click on a URL with bracketed plain keys writes them as plain keys (ISS-2473)', () => {
  assert.equal(
    filterClick(
      'query=food&location%5B0%5D=Seattle&coords%5B0%5D=-122.3%2C47.6',
      addFilter,
    ),
    '/search?query=food&location=Seattle&coords=-122.3%2C47.6' +
      '&filters%5Bpayment%5D%5B0%5D=Free',
  );
});

test('clearing filters drops them and the page, and keeps the rest', () => {
  assert.equal(
    filterClick(
      'query=food&filters%5Bpayment%5D%5B0%5D=Free&sllc=1&page=2&utm_source=x',
      clearFilters,
    ),
    '/search?query=food&sllc=1&utm_source=x',
  );
});

test('the coords redirect keeps a repeated location as its first value, and the page', () => {
  assert.equal(
    rewriteSearchUrl(
      { query: 'food', location: ['Seattle', 'Tacoma'], page: '2' },
      (intent) => ({
        ...intent,
        coords: { stated: true, value: [-122.3, 47.6] },
      }),
      { newSearch: false, basePath: '/en' },
    ),
    '/en/search?query=food&location=Seattle&coords=-122.3%2C47.6&page=2',
  );
});

test('a repeat the lift reads is kept, and repeated pass-through keys are written back as received', () => {
  assert.equal(
    filterClick(
      'taxonomy=BD-1800&taxonomy=BD-5000&utm_source=a&utm_source=b',
      clearFilters,
    ),
    '/search?taxonomy=BD-1800%2CBD-5000&utm_source=a&utm_source=b',
  );
});

test('a repeated envelope marker is read as its first value', () => {
  assert.equal(
    filterClick('query=food&sllc=1&sllc=1&a=low_info&a=low_info', clearFilters),
    '/search?query=food&a=low_info&sllc=1',
  );
});

/** Every plain key of a query, each repeated with a second value. */
function withRepeats(query: string): string {
  const params = new URLSearchParams(query);
  const out = new URLSearchParams();
  for (const [key, value] of params) {
    out.append(key, value);
    if (!key.includes('[')) out.append(key, `${value}2`);
  }
  return out.toString();
}

test('no search writer emits key[n] for a plain key', () => {
  const queries = ALL_FIXTURES.flatMap((f) => [f.query, withRepeats(f.query)]);
  assert.ok(queries.length >= 60, `only ${queries.length} queries`);
  for (const query of queries) {
    const plain = new Set(
      [...new URLSearchParams(query).keys()].filter((k) => !k.includes('[')),
    );
    for (const url of [
      filterClick(query, (i) => i),
      rewriteSearchUrl(rawSearchParams(query), (i) => i, {
        newSearch: false,
        basePath: '/en',
      }),
    ]) {
      const written = [...new URLSearchParams(url.split('?')[1] ?? '').keys()];
      const bracketed = written.filter(
        (k) => k.includes('[') && plain.has(k.slice(0, k.indexOf('['))),
      );
      assert.deepStrictEqual(bracketed, [], `${query} -> ${url}`);
    }
  }
});

test('a rewrite changes bytes, not meaning: the URL it writes lifts to the intent it read', () => {
  for (const fixture of ALL_FIXTURES.filter((f) => !f.loses)) {
    for (const query of [fixture.query, withRepeats(fixture.query)]) {
      const raw = rawSearchParams(query);
      const read = liftSearchParams(raw);
      const url = rewriteSearchUrl(raw, (i) => i, { newSearch: false });
      const written = liftQueryString(url.split('?')[1] ?? '');
      assert.deepStrictEqual(written.intent, read.intent, `${query} -> ${url}`);
      assert.deepStrictEqual(
        written.envelope,
        read.envelope,
        `${query} -> ${url}`,
      );
    }
  }
});
