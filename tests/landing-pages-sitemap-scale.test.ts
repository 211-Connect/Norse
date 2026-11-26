/**
 * Sitemaps at scale: 36,000 live pages in two locales (72,000 URLs), more
 * than any tenant plans, through the same pure builders the routes use.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  HTML_SITEMAP_LINK_LIMIT,
  htmlSitemapTopics,
  splitsByTopic,
} from '../src/app/(app)/features/landing-pages/lib/htmlSitemap';
import type {
  LandingRegion,
  LandingSitemap,
} from '../src/app/(app)/features/landing-pages/lib/types';
import {
  SITEMAP_PAGE_SIZE,
  landingSitemapNumber,
  landingSitemapUrls,
  sitemapIndexXml,
  sitemapPage,
  sitemapPageCount,
  urlsetXml,
} from '../src/app/(app)/features/landing-pages/lib/xmlSitemap';

const TOPICS = 3;
const COUNTIES = 200;
const CITIES_PER_COUNTY = 59;
// Per topic: the state, its counties and their cities.
const PER_TOPIC = 1 + COUNTIES + COUNTIES * CITIES_PER_COUNTY;
const PAGES = TOPICS * PER_TOPIC;
const origin = 'https://search.example.org';

function bigSitemap(): LandingSitemap {
  const entries: LandingSitemap['entries'] = [];
  let id = 0;
  const add = (topic: number, region: LandingRegion, slug: string) =>
    entries.push({
      id: String(++id),
      topicId: String(topic),
      region,
      paths: { en: `topic-${topic}/${slug}`, es: `tema-${topic}/${slug}` },
      lastModified: new Date(Date.UTC(2026, 0, 1 + (id % 300))).toISOString(),
    });
  for (let t = 1; t <= TOPICS; t++) {
    add(
      t,
      { id: 'state:WA', type: 'state', name: 'Washington', state: 'WA' },
      'washington',
    );
    for (let c = 1; c <= COUNTIES; c++) {
      const countyId = `county:${c}`;
      add(
        t,
        { id: countyId, type: 'county', name: `County ${c}, WA`, state: 'WA' },
        `county-${c}-wa`,
      );
      for (let p = 1; p <= CITIES_PER_COUNTY; p++) {
        add(
          t,
          {
            id: `place:${c}-${p}`,
            type: 'place',
            name: `City ${c}-${p}`,
            state: 'WA',
            countyId,
          },
          `city-${c}-${p}-wa`,
        );
      }
    }
  }
  return {
    topics: Object.fromEntries(
      Array.from({ length: TOPICS }, (_, i) => [
        String(i + 1),
        { en: `Topic ${i + 1}`, es: `Tema ${i + 1}` },
      ]),
    ),
    entries,
  };
}

const timed = <T>(run: () => T): { value: T; ms: number } => {
  const start = performance.now();
  const value = run();
  return { value, ms: performance.now() - start };
};

describe(`sitemaps with ${PAGES.toLocaleString('en')} pages`, () => {
  const sitemap = bigSitemap();
  const { value: urls, ms: urlsMs } = timed(() =>
    landingSitemapUrls(sitemap, { origin, defaultLocale: 'en' }),
  );

  test('one URL per page and locale, built fast', () => {
    assert.equal(urls.length, PAGES * 2);
    assert.ok(urlsMs < 1000, `landingSitemapUrls took ${urlsMs} ms`);
  });

  test('the index lists every file, each within the limits', () => {
    const files = sitemapPageCount(urls);
    assert.equal(files, Math.ceil((PAGES * 2) / SITEMAP_PAGE_SIZE));
    const index = sitemapIndexXml(urls, origin);
    const locs = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.equal(locs.length, files);
    locs.forEach((loc, i) =>
      assert.equal(loc, `${origin}/sitemaps/landing-${i + 1}.xml`),
    );
    // Every file name the index lists is one the route accepts.
    for (const loc of locs) {
      assert.notEqual(landingSitemapNumber(loc.split('/').at(-1)!), null);
    }

    const seen = new Set<string>();
    for (let n = 1; n <= files; n++) {
      const { value: xml, ms } = timed(() => urlsetXml(sitemapPage(urls, n)));
      const count = (xml.match(/<url>/g) ?? []).length;
      assert.ok(count <= SITEMAP_PAGE_SIZE && count > 0);
      // The protocol's limits: 50,000 URLs and 50 MB uncompressed.
      assert.ok(Buffer.byteLength(xml) < 50 * 1024 * 1024);
      assert.ok(ms < 1000, `landing-${n}.xml took ${ms} ms`);
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) seen.add(m[1]);
    }
    assert.equal(seen.size, urls.length, 'every URL in exactly one file');
    assert.equal(sitemapPage(urls, files + 1).length, 0);
  });

  test('every URL lists both language versions and x-default', () => {
    for (const url of urls) {
      assert.deepEqual(Object.keys(url.alternates), ['en', 'es', 'x-default']);
    }
  });

  test('a new page does not move earlier pages to other files', () => {
    const before = sitemapPage(urls, 1).map((url) => url.loc);
    const grown = bigSitemap();
    const last = grown.entries.at(-1)!;
    grown.entries.push({
      ...last,
      id: String(PAGES + 1),
      paths: { en: 'topic-1/new-wa', es: 'tema-1/new-wa' },
    });
    const after = landingSitemapUrls(grown, { origin, defaultLocale: 'en' });
    assert.deepEqual(
      sitemapPage(after, 1).map((url) => url.loc),
      before,
    );
  });

  test('the HTML sitemap splits by topic, built fast', () => {
    const { value: topics, ms } = timed(() =>
      htmlSitemapTopics(sitemap, {
        locale: 'en',
        defaultLocale: 'en',
        regionStrings: {
          county: '{{name}} County',
          place: '{{name}}, {{state}}',
        },
      }),
    );
    assert.ok(ms < 1000, `htmlSitemapTopics took ${ms} ms`);
    assert.equal(topics.length, TOPICS);
    assert.ok(PAGES > HTML_SITEMAP_LINK_LIMIT);
    assert.equal(splitsByTopic(topics), true);
    for (const topic of topics) {
      assert.equal(topic.count, PER_TOPIC);
      assert.equal(topic.states.length, 1);
      assert.equal(topic.states[0].counties.length, COUNTIES);
      for (const county of topic.states[0].counties) {
        assert.equal(county.cities.length, CITIES_PER_COUNTY);
      }
    }
  });

  test('the cached page list stays small enough for the memory cache', () => {
    // `landing_sitemap` keeps up to 64 MB in memory (withCache.ts).
    const bytes = Buffer.byteLength(JSON.stringify(sitemap));
    assert.ok(bytes < 16 * 1024 * 1024, `${bytes} bytes`);
  });
});
