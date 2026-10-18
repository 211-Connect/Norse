// The /search links that still build their own URL (features/search/utils/handBuiltSearchLinks.ts): each one's
// exact output, and the intent it lifts to. They keep their bytes until the ticket named on each moves them
// onto the serializer.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { liftQueryString } from '../src/app/(app)/features/search/intent';
import {
  categorySearchHref,
  directorySourceSearchHref,
  topicSearchHref,
} from '../src/app/(app)/features/search/utils/handBuiltSearchLinks';

import { intentWith } from './search-intent-fixtures';

const queryOf = (href: string) => {
  assert.ok(href.startsWith('/search?'), href);
  return href.slice('/search?'.length);
};

test('home topic card: a taxonomy subtopic is a topic card', () => {
  const href = topicSearchHref(
    'BD-1800.2000,BH-1800',
    'Synthetic label & more',
    'taxonomy',
  );
  assert.equal(
    href,
    '/search?query=BD-1800.2000%2CBH-1800&query_label=Synthetic%20label%20%26%20more&query_type=taxonomy',
  );
  assert.deepStrictEqual(liftQueryString(queryOf(href)), {
    generation: 'taxonomy_card',
    modifiers: [],
    intent: intentWith({
      query: 'BD-1800.2000,BH-1800',
      queryLabel: 'Synthetic label & more',
      queryType: 'taxonomy',
    }),
    envelope: { passThrough: [] },
  });
});

test('home topic card: no query type is written empty, and the query is not trimmed (ISS-2407)', () => {
  const href = topicSearchHref(' syntheticquery ', 'Synthetic', undefined);
  assert.equal(
    href,
    '/search?query=%20syntheticquery%20&query_label=Synthetic&query_type=',
  );
  assert.deepStrictEqual(liftQueryString(queryOf(href)), {
    generation: 'classic_text',
    modifiers: [],
    intent: intentWith({
      query: ' syntheticquery ',
      queryLabel: 'Synthetic',
      queryType: '',
    }),
    envelope: { passThrough: [] },
  });
});

test('resource category badge is a topic card', () => {
  const href = categorySearchHref('BD-1800.2000', 'Synthetic (food)');
  assert.equal(
    href,
    '/search?query=BD-1800.2000&query_label=Synthetic%20(food)&query_type=taxonomy',
  );
  assert.deepStrictEqual(liftQueryString(queryOf(href)), {
    generation: 'taxonomy_card',
    modifiers: [],
    intent: intentWith({
      query: 'BD-1800.2000',
      queryLabel: 'Synthetic (food)',
      queryType: 'taxonomy',
    }),
    envelope: { passThrough: [] },
  });
});

test('printable-directory source replays its stored search inside the directory', () => {
  const href = directorySourceSearchHref(
    {
      query: 'syntheticquery',
      query_type: 'text',
      location: 'Syntheticplace, WA',
      coords: '-122.3,47.6',
      distance: '10',
      filters: { age_group: ['adult', 'senior'] },
    },
    'synthetic-directory',
    'synthetic-section',
  );
  assert.equal(
    href,
    '/search?query=syntheticquery&query_type=text&location=Syntheticplace%2C%20WA&coords=-122.3%2C47.6&distance=10&filters[age_group][0]=adult&filters[age_group][1]=senior&pdid=synthetic-directory&pdsid=synthetic-section',
  );
  assert.deepStrictEqual(liftQueryString(queryOf(href)), {
    generation: 'classic_text',
    modifiers: ['printable_directory', 'filters', 'distance', 'coords'],
    intent: intentWith({
      query: 'syntheticquery',
      queryType: 'text',
      location: 'Syntheticplace, WA',
      coords: [-122.3, 47.6],
      distance: '10',
      filters: { age_group: ['adult', 'senior'] },
    }),
    envelope: {
      pdid: 'synthetic-directory',
      pdsid: 'synthetic-section',
      passThrough: [],
    },
  });
});
