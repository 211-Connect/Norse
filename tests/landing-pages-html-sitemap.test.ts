import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  HTML_SITEMAP_LINK_LIMIT,
  htmlSitemapTopics,
  sitemapLocales,
  splitsByTopic,
  topicSlugsByLocale,
} from '../src/app/(app)/features/landing-pages/lib/htmlSitemap';
import type {
  LandingRegion,
  LandingSitemap,
} from '../src/app/(app)/features/landing-pages/lib/types';

let next = 0;
const entry = (
  topicId: string,
  region: LandingRegion,
  paths: Record<string, string>,
) => ({ id: String(++next), topicId, region, paths, lastModified: '' });

const wa: LandingRegion = {
  id: 'state:WA',
  type: 'state',
  name: 'Washington',
  state: 'WA',
};
const pierce: LandingRegion = {
  id: 'county:53053',
  type: 'county',
  name: 'Pierce County, WA',
  state: 'WA',
};
const king: LandingRegion = {
  id: 'county:53033',
  type: 'county',
  name: 'King County, WA',
  state: 'WA',
};
const tacoma: LandingRegion = {
  id: 'place:5370000',
  type: 'place',
  name: 'Tacoma',
  state: 'WA',
  countyId: 'county:53053',
};
const lakewood: LandingRegion = {
  id: 'place:5338038',
  type: 'place',
  name: 'Lakewood',
  state: 'WA',
  countyId: 'county:53053',
};
const yakima: LandingRegion = {
  id: 'place:5380010',
  type: 'place',
  name: 'Yakima',
  state: 'WA',
  countyId: 'county:53077',
};

const sitemap: LandingSitemap = {
  topics: { '1': { en: 'Food', es: 'Comida' }, '2': { en: 'Housing' } },
  entries: [
    entry('1', tacoma, { en: 'food/tacoma-wa', es: 'comida/tacoma-wa' }),
    entry('1', pierce, {
      en: 'food/pierce-county-wa',
      es: 'comida/pierce-county-wa',
    }),
    entry('1', wa, { en: 'food/washington' }),
    entry('1', king, { en: 'food/king-county-wa' }),
    entry('1', lakewood, { en: 'food/lakewood-wa' }),
    entry('1', yakima, { en: 'food/yakima-wa' }),
    entry('2', king, { en: 'housing/king-county-wa' }),
  ],
};
const regionStrings = {
  county: '{{name}} County',
  place: '{{name}}, {{state}}',
};

describe('HTML sitemap', () => {
  const topics = htmlSitemapTopics(sitemap, {
    locale: 'en',
    defaultLocale: 'en',
    regionStrings,
  });

  test('topics A–Z with their slug and link count', () => {
    assert.deepEqual(
      topics.map((t) => [t.name, t.slug, t.count]),
      [
        ['Food', 'food', 6],
        ['Housing', 'housing', 1],
      ],
    );
  });

  test('state, counties A–Z, cities under their county, loose cities last', () => {
    const [state] = topics[0].states;
    assert.equal(state.label, 'Washington');
    assert.equal(state.path, 'food/washington');
    assert.deepEqual(
      state.counties.map((c) => [
        c.label,
        c.path,
        c.cities.map((x) => x.label),
      ]),
      [
        ['King County', 'food/king-county-wa', []],
        [
          'Pierce County',
          'food/pierce-county-wa',
          ['Lakewood, WA', 'Tacoma, WA'],
        ],
        ['', undefined, ['Yakima, WA']],
      ],
    );
  });

  test('a state without a page is a heading without a link', () => {
    const [housing] = topics.slice(1);
    assert.equal(housing.states[0].label, 'Washington');
    assert.equal(housing.states[0].path, undefined);
  });

  test('only pages the locale has, with its topic name', () => {
    const es = htmlSitemapTopics(sitemap, {
      locale: 'es',
      defaultLocale: 'en',
      regionStrings: {
        county: 'Condado de {{name}}',
        place: '{{name}}, {{state}}',
      },
    });
    assert.deepEqual(
      es.map((t) => [t.name, t.slug, t.count]),
      [['Comida', 'comida', 2]],
    );
    assert.equal(es[0].states[0].counties[0].label, 'Condado de Pierce');
  });

  test('splits past the link limit', () => {
    assert.equal(splitsByTopic(topics), false);
    assert.equal(
      splitsByTopic([{ ...topics[0], count: HTML_SITEMAP_LINK_LIMIT + 1 }]),
      true,
    );
  });

  test('locales and a topic slug per locale', () => {
    assert.deepEqual(sitemapLocales(sitemap), ['en', 'es']);
    assert.deepEqual(topicSlugsByLocale(sitemap, '1'), {
      en: 'food',
      es: 'comida',
    });
  });
});
