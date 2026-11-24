import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { hubPages } from '../src/app/(app)/features/landing-pages/lib/hub';
import {
  isRefinedRequest,
  landingBaseParams,
  landingRefinements,
  landingSearchParams,
  requestedPage,
  toLandingHref,
} from '../src/app/(app)/features/landing-pages/lib/search';
import {
  breadcrumbJsonLd,
  landingAlternates,
  redirectHref,
} from '../src/app/(app)/features/landing-pages/lib/seo';
import type { LandingSitemap } from '../src/app/(app)/features/landing-pages/lib/types';

const base = landingBaseParams({
  search: { queryType: 'taxonomy', query: 'BD-1800.2000' },
  topicName: 'Food Pantries',
  regionId: 'place:5370000',
  location: 'Tacoma, WA',
  searchEngine: 'keyword' as never,
});

describe('landing page search', () => {
  test('fixes the topic search on the page region', () => {
    const params = Object.fromEntries(base);
    assert.equal(params.query, 'BD-1800.2000');
    assert.equal(params.query_type, 'taxonomy');
    assert.equal(params.location, 'Tacoma, WA');
    assert.equal(params.region, 'place:5370000');
  });

  test('takes only refinements from the query string', () => {
    const request = {
      page: '2',
      sort: 'distance',
      'filters[languages]': ['es', 'fr'],
      query: 'something else',
      location: 'Seattle, WA',
    };
    assert.deepEqual(landingRefinements(request), {
      page: '2',
      sort: 'distance',
      'filters[languages]': ['es', 'fr'],
    });
    const full = landingSearchParams(base, request);
    assert.equal(full.query, 'BD-1800.2000');
    assert.equal(full.location, 'Tacoma, WA');
    assert.equal(full.sort, 'distance');
  });

  test('a page number alone is not a refined variant', () => {
    assert.equal(isRefinedRequest({ page: '3' }), false);
    assert.equal(isRefinedRequest({ age: '30' }), true);
    assert.equal(isRefinedRequest({ 'filters[x]': 'y' }), true);
    assert.equal(isRefinedRequest({ utm_source: 'x' }), false);
  });

  test('reads the page number', () => {
    assert.equal(requestedPage({}), 1);
    assert.equal(requestedPage({ page: '4' }), 4);
    assert.equal(requestedPage({ page: ['5', '6'] }), 5);
    assert.equal(requestedPage({ page: '-1' }), 1);
    assert.equal(requestedPage({ page: 'x' }), 1);
  });

  test('keeps a control on the page while the search is its own', () => {
    const own = `/search?${new URLSearchParams([...base, ['age', '30']])}`;
    assert.equal(
      toLandingHref(own, '/es/bancos/tacoma-wa', base),
      '/es/bancos/tacoma-wa?age=30',
    );
    const plain = `/search?${new URLSearchParams(base)}`;
    assert.equal(
      toLandingHref(plain, '/food/tacoma-wa', base),
      '/food/tacoma-wa',
    );
  });

  test('leaves for /search once the search changes', () => {
    const other = `/search?${new URLSearchParams(
      base.map(([k, v]) => [k, k === 'location' ? 'Seattle, WA' : v]),
    )}`;
    assert.equal(toLandingHref(other, '/food/tacoma-wa', base), other);
  });
});

describe('landing page SEO', () => {
  test('redirect targets get the locale prefix', () => {
    assert.equal(redirectHref('food/tacoma-wa', 'en', 'en'), '/food/tacoma-wa');
    assert.equal(
      redirectHref('comida/tacoma-wa', 'es', 'en'),
      '/es/comida/tacoma-wa',
    );
    assert.equal(
      redirectHref('/search?query=x', 'es', 'en'),
      '/es/search?query=x',
    );
    assert.equal(
      redirectHref('/search?query=x', 'en', 'en'),
      '/search?query=x',
    );
  });

  test('canonical and hreflang, with x-default and paging', () => {
    const alternates = { en: 'food/tacoma-wa', es: 'comida/tacoma-wa' };
    const first = landingAlternates({
      origin: 'https://search.example.org',
      locale: 'es',
      defaultLocale: 'en',
      alternates,
      page: 1,
    });
    assert.equal(
      first.canonical,
      'https://search.example.org/es/comida/tacoma-wa',
    );
    assert.deepEqual(first.languages, {
      en: 'https://search.example.org/food/tacoma-wa',
      es: 'https://search.example.org/es/comida/tacoma-wa',
      'x-default': 'https://search.example.org/food/tacoma-wa',
    });
    const third = landingAlternates({
      origin: 'https://search.example.org',
      locale: 'en',
      defaultLocale: 'en',
      alternates,
      page: 3,
    });
    assert.equal(
      third.canonical,
      'https://search.example.org/food/tacoma-wa?page=3',
    );
  });

  test('breadcrumb JSON-LD links every crumb and cannot close the script', () => {
    const json = breadcrumbJsonLd(
      [
        { label: 'Home', href: '/' },
        { label: 'Food', href: '/food' },
        { label: '</script>Tacoma' },
      ],
      'https://h.org',
      '/food/tacoma-wa',
    );
    assert.ok(!json.includes('</script>'));
    const data = JSON.parse(json);
    assert.equal(data['@type'], 'BreadcrumbList');
    assert.deepEqual(
      data.itemListElement.map((item: { item: string }) => item.item),
      ['https://h.org/', 'https://h.org/food', 'https://h.org/food/tacoma-wa'],
    );
    assert.equal(data.itemListElement[2].name, '</script>Tacoma');
  });
});

describe('topic hub', () => {
  const region = (id: string, type: 'state' | 'county' | 'place') => ({
    id,
    type,
    name: id,
    state: 'WA',
  });
  const sitemap: LandingSitemap = {
    topics: { '1': { en: 'Food' } },
    entries: [
      {
        id: 'a',
        topicId: '1',
        region: region('state:WA', 'state'),
        paths: { en: 'food/washington' },
        lastModified: '',
      },
      {
        id: 'b',
        topicId: '1',
        region: region('county:1', 'county'),
        paths: { en: 'food/pierce-county-wa' },
        lastModified: '',
      },
      {
        id: 'c',
        topicId: '2',
        region: region('county:2', 'county'),
        paths: { en: 'housing/king-county-wa' },
        lastModified: '',
      },
    ],
  };

  test('lists the highest level the topic has', () => {
    assert.deepEqual(
      hubPages(sitemap, 'food', 'en')?.pages.map((p) => p.path),
      ['food/washington'],
    );
    assert.deepEqual(
      hubPages(sitemap, 'housing', 'en')?.pages.map((p) => p.path),
      ['housing/king-county-wa'],
    );
  });

  test('is null for an unknown topic or locale', () => {
    assert.equal(hubPages(sitemap, 'fo', 'en'), null);
    assert.equal(hubPages(sitemap, 'food', 'es'), null);
  });
});
