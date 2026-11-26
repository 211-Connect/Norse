import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  SITEMAP_PAGE_SIZE,
  landingSitemapNumber,
  landingSitemapUrls,
  sitemapIndexXml,
  sitemapPage,
  sitemapPageCount,
  urlsetXml,
} from '../src/app/(app)/features/landing-pages/lib/xmlSitemap';
import type { LandingSitemap } from '../src/app/(app)/features/landing-pages/lib/types';

const origin = 'https://search.example.org';
const region = {
  id: 'place:5370000',
  type: 'place' as const,
  name: 'Tacoma',
  state: 'WA',
};
const sitemap: LandingSitemap = {
  topics: {},
  entries: [
    {
      id: '10',
      topicId: '1',
      region,
      paths: { es: 'comida/tacoma-wa', en: 'food/tacoma-wa' },
      lastModified: '2026-11-20T08:00:00.000Z',
    },
    {
      id: '9',
      topicId: '1',
      region,
      paths: { es: 'solo/tacoma-wa' },
      lastModified: '2026-11-21T08:00:00.000Z',
    },
  ],
};

describe('landing sitemap URLs', () => {
  const urls = landingSitemapUrls(sitemap, { origin, defaultLocale: 'en' });

  test('one URL per page and locale, pages in id order', () => {
    assert.deepEqual(
      urls.map((url) => url.loc),
      [
        'https://search.example.org/es/solo/tacoma-wa',
        'https://search.example.org/food/tacoma-wa',
        'https://search.example.org/es/comida/tacoma-wa',
      ],
    );
  });

  test('every version lists all versions and x-default', () => {
    assert.deepEqual(urls[1].alternates, {
      en: 'https://search.example.org/food/tacoma-wa',
      es: 'https://search.example.org/es/comida/tacoma-wa',
      'x-default': 'https://search.example.org/food/tacoma-wa',
    });
    assert.deepEqual(urls[2].alternates, urls[1].alternates);
  });

  test('no x-default without a default-locale version', () => {
    assert.equal(urls[0].alternates['x-default'], undefined);
  });
});

describe('sitemap files', () => {
  test('reads landing-{n}.xml only', () => {
    assert.equal(landingSitemapNumber('landing-1.xml'), 1);
    assert.equal(landingSitemapNumber('landing-12.xml'), 12);
    assert.equal(landingSitemapNumber('landing-0.xml'), null);
    assert.equal(landingSitemapNumber('landing-01.xml'), null);
    assert.equal(landingSitemapNumber('resources-1.xml'), null);
    assert.equal(landingSitemapNumber('landing-1.xml.gz'), null);
  });

  test('pages of 10,000', () => {
    const many = Array.from({ length: SITEMAP_PAGE_SIZE * 2 + 1 }, (_, i) => i);
    assert.equal(sitemapPageCount(many), 3);
    assert.equal(sitemapPage(many, 1).length, SITEMAP_PAGE_SIZE);
    assert.deepEqual(sitemapPage(many, 3), [SITEMAP_PAGE_SIZE * 2]);
    assert.deepEqual(sitemapPage(many, 4), []);
  });

  test('index names each file with its latest lastmod', () => {
    const urls = landingSitemapUrls(sitemap, { origin, defaultLocale: 'en' });
    const xml = sitemapIndexXml(urls, origin);
    assert.match(
      xml,
      /^<\?xml version="1.0" encoding="UTF-8"\?>\n<sitemapindex /,
    );
    assert.ok(
      xml.includes(
        '<loc>https://search.example.org/sitemaps/landing-1.xml</loc>\n    <lastmod>2026-11-21</lastmod>',
      ),
    );
    assert.equal(xml.match(/<sitemap>/g)?.length, 1);
  });

  test('urlset has hreflang links and escapes URLs', () => {
    const xml = urlsetXml([
      {
        loc: 'https://h.org/a?x=1&y=<2>',
        lastmod: '2026-11-20T08:00:00.000Z',
        alternates: { en: 'https://h.org/a', 'x-default': 'https://h.org/a' },
      },
    ]);
    assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
    assert.ok(xml.includes('<loc>https://h.org/a?x=1&amp;y=&lt;2&gt;</loc>'));
    assert.ok(xml.includes('<lastmod>2026-11-20</lastmod>'));
    assert.ok(
      xml.includes(
        '<xhtml:link rel="alternate" hreflang="x-default" href="https://h.org/a"/>',
      ),
    );
  });
});
