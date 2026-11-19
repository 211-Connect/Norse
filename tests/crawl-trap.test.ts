// ISS-2307: the `&amp;` crawl trap. An outside crawler reads React's correctly escaped `href="…&amp;page=2"`
// without decoding it and requests `?…&amp;page=2`, so the key arrives as `amp;page`. Pagination then copied
// every key and replaced only `page`, adding one `amp;` level per hop: 944 URLs up to 35 levels deep, 87% on
// Maryland (ISS-2379). Each hit ran a full search against Norse-API.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NextRequest } from 'next/server';

import { rawSearchParams } from '../src/app/(app)/features/search/intent';
import { rewriteSearchUrl } from '../src/app/(app)/features/search/intent/rewrite';
import { sortHref } from '../src/app/(app)/features/search/utils/sortHref';
import { currentSearchString } from '../src/app/(app)/shared/utils/currentSearchString';
import { indexableRobotsRules } from '../src/app/robotsRules';
import { isCrawlTrapKey, withoutCrawlTrapKeys } from '../src/lib/crawl-trap';
import { crawlTrapMiddleware } from '../src/middlewares/crawlTrapMiddleware';
import { proxy } from '../src/proxy';

// The shape the crawler requests, as found in the harvest (ISS-2379, fixture "ISS-2307 &amp; cascade").
const TRAP_QUERY =
  'query_type=text&amp;sort=relevance&amp;amp;page=1&amp;amp;amp;page=2';

// The shape 98% of Watt Advertising's paid clicks land on (584 URLs, ISS-2616). It must never be refused or
// disallowed; gclid and gad_* pass through.
const WATT_QUERY =
  'query=BH-3800.7000&query_label=Rent+Assistance&query_type=taxonomy&entry=topic_card' +
  '&location=Grays+Harbor+County&coords=-123.869547%2C47.147228&gclid=abc&gad_source=1';

const request = (url: string) => new NextRequest(new URL(url));

test('isCrawlTrapKey: a key the crawler minted from an unescaped &amp;, at any depth or case', () => {
  for (const key of [
    'amp;page',
    'amp;amp;amp;sort',
    'AMP;page',
    'Amp;query',
    'amp;',
  ]) {
    assert.equal(isCrawlTrapKey(key), true, key);
  }
  for (const key of [
    'page',
    'amplitude',
    'ampersand',
    'example',
    'gad_source',
    'camp;x',
    '',
  ]) {
    assert.equal(isCrawlTrapKey(key), false, key);
  }
});

test('withoutCrawlTrapKeys keeps every other pair, in order, repeats included', () => {
  const kept = withoutCrawlTrapKeys(
    new URLSearchParams(`taxonomy=A&${TRAP_QUERY}&taxonomy=B&gclid=x`),
  );
  assert.equal(
    kept.toString(),
    'taxonomy=A&query_type=text&taxonomy=B&gclid=x',
  );
});

test('the edge answers 410 to any route whose query has a crawl-trap key, on any host', () => {
  for (const url of [
    `https://marylandaccesspoint.211md.org/search?${TRAP_QUERY}`,
    `https://search.wa211.org/en/search?query=food&amp;page=2`,
    `https://search.wa211.org/es/search/abc123?amp;entry=share`,
    `https://search.211md.org/favorites?x=1&amp%3Bpage=3`, // percent-encoded `;`
    `https://search.211md.org/?amp;amp;locale=en`,
  ]) {
    const response = crawlTrapMiddleware(request(url));
    assert.equal(response?.status, 410, url);
    assert.match(response!.headers.get('x-robots-tag') ?? '', /noindex/, url);
  }
});

test('the 410 is a small page that links a person on to the same URL without the broken keys', async () => {
  const response = crawlTrapMiddleware(
    request(
      'https://search.wa211.org/en/search?query=food&amp;page=2&location=Lewis+County',
    ),
  )!;
  assert.equal(response.status, 410);
  assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
  const html = await response.text();
  assert.ok(
    html.includes(
      'href="/en/search?query=food&amp;location=Lewis+County" rel="nofollow"',
    ),
    html,
  );
  assert.ok(!/amp%3B|amp;page/i.test(html), html);
});

test('the 410 page links to the bare path when only broken keys remain, and reflects nothing raw', async () => {
  const bare = await crawlTrapMiddleware(
    request('https://search.wa211.org/search?amp;page=2'),
  )!.text();
  assert.ok(bare.includes('href="/search" rel="nofollow"'), bare);

  const hostile = await crawlTrapMiddleware(
    request(
      'https://search.wa211.org/search?q="><script>alert(1)</script>&amp;x=1',
    ),
  )!.text();
  assert.ok(!/<script/i.test(hostile), hostile);
  assert.ok(!hostile.includes('"><script'), hostile);
  assert.ok(!hostile.includes('alert(1)'), hostile);
});

test('the edge lets every other URL through: Watt ads, values that contain "amp;", ordinary search URLs', () => {
  for (const url of [
    `https://search.wa211.org/search?${WATT_QUERY}`,
    `https://search.wa211.org/en/search?query_label=Food%20%26amp%3B%20Shelter&query=food`,
    `https://search.wa211.org/en/search?query=amp%3Bpage`,
    `https://search.wa211.org/en/search?query=food&page=2&sort=name`,
    `https://search.wa211.org/en`,
  ]) {
    assert.equal(crawlTrapMiddleware(request(url)), undefined, url);
  }
});

test('proxy answers 410 before it looks the tenant up: a trapped request costs no CMS call', async () => {
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = (async () => {
    fetched++;
    throw new Error('the proxy should not fetch for a trapped request');
  }) as typeof fetch;
  try {
    const response = await proxy(
      request(`https://marylandaccesspoint.211md.org/search?${TRAP_QUERY}`),
    );
    assert.equal(response.status, 410);
    assert.equal(fetched, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('pagination and the language switch: the current search string drops crawl-trap keys', () => {
  const current = currentSearchString(new URLSearchParams(TRAP_QUERY));
  assert.equal(current, '?query_type=text');
  // What pagination does with it: the next hop carries no deeper key than the last.
  const next = new URLSearchParams(current);
  next.set('page', '2');
  assert.equal(next.toString(), 'query_type=text&page=2');
  assert.equal(currentSearchString(new URLSearchParams('')), '');
  assert.equal(
    currentSearchString(new URLSearchParams('query=a b&location=Seattle')),
    '?query=a%20b&location=Seattle',
  );
});

test('sort: the new URL drops crawl-trap keys and the page', () => {
  assert.equal(
    sortHref('/en/search', new URLSearchParams(`${TRAP_QUERY}&page=4`), 'name'),
    '/en/search?query_type=text&sort=name',
  );
  assert.equal(
    sortHref('/search', new URLSearchParams(WATT_QUERY), 'distance'),
    `/search?${WATT_QUERY}&sort=distance`,
  );
});

test('filter navigation and the coords redirect (rewriteSearchUrl) drop crawl-trap keys, keep other pass-through keys', () => {
  const url = rewriteSearchUrl(
    rawSearchParams(`query=food&query_type=text&${TRAP_QUERY}&gclid=x`),
    (intent) => intent,
    { newSearch: false, basePath: '/en' },
  );
  assert.ok(!/amp;|amp%3B/i.test(url), url);
  assert.match(url, /gclid=x/);
  assert.match(url, /query=food/);
});

/** Google's robots.txt matching (RFC 9309): `*` any run of characters, `$` end, longest match wins, allow on a tie. */
function isAllowed(
  rules: { allow?: string | string[]; disallow?: string | string[] },
  pathAndQuery: string,
): boolean {
  const toRegExp = (pattern: string) =>
    new RegExp(
      '^' +
        pattern
          .split('')
          .map((c, i, all) =>
            c === '*'
              ? '.*'
              : c === '$' && i === all.length - 1
                ? '$'
                : c.replace(/[.+?^${}()|[\]\\]/g, '\\$&'),
          )
          .join(''),
    );
  const longest = (patterns: string | string[] | undefined) =>
    [patterns ?? []]
      .flat()
      .filter((p) => p && toRegExp(p).test(pathAndQuery))
      .reduce((max, p) => Math.max(max, p.length), -1);
  return longest(rules.allow) >= longest(rules.disallow);
}

test('robots.txt disallows the crawl-trap shapes for every crawler, and nothing a person or an ad lands on', () => {
  const rules = [indexableRobotsRules().rules].flat();
  const everyone = rules.find((rule) => rule.userAgent === '*');
  assert.ok(everyone, 'no User-agent: * group');

  for (const trap of [
    `/search?${TRAP_QUERY}`,
    '/en/search?amp;page=2',
    '/search/abc?query=x&amp;amp;page=9',
  ]) {
    assert.equal(isAllowed(everyone, trap), false, trap);
  }
  for (const fine of [
    `/search?${WATT_QUERY}`,
    '/en/search?query_label=Food%20%26amp%3B%20Shelter',
    '/en/search?query=food&page=2',
    '/en/search/abc123',
    '/',
  ]) {
    assert.equal(isAllowed(everyone, fine), true, fine);
  }
  // The matcher is not vacuous: it does refuse what the existing rules refuse.
  assert.equal(isAllowed(everyone, '/api/resource-titles'), false);
});
