// ISS-2678 (from ISS-2672): resource detail pages tell search engines their own URL (canonical, decided
// 2026-11-06: every page's canonical points to itself), from the record's id and the tenant's primary domain.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canonicalOrigin,
  resourceCanonicalUrl,
} from '../src/app/(app)/features/resource/seo/resourceSeo';

const ORIGIN = { protocol: 'https', host: 'search.wa211.org' };
const ID = '0f5c2d4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f';

test('canonical: the page itself, with no locale prefix on the default locale', () => {
  assert.equal(
    resourceCanonicalUrl({
      ...ORIGIN,
      locale: 'en',
      defaultLocale: 'en',
      id: ID,
    }),
    `https://search.wa211.org/search/${ID}`,
  );
});

test('canonical: other locales keep their prefix', () => {
  assert.equal(
    resourceCanonicalUrl({
      ...ORIGIN,
      locale: 'es',
      defaultLocale: 'en',
      id: ID,
    }),
    `https://search.wa211.org/es/search/${ID}`,
  );
  assert.equal(
    resourceCanonicalUrl({
      ...ORIGIN,
      locale: 'zh-Hans',
      defaultLocale: 'en',
      id: ID,
    }),
    `https://search.wa211.org/zh-Hans/search/${ID}`,
  );
});

test('canonical: one URL per resource whatever the id case in the request', () => {
  assert.equal(
    resourceCanonicalUrl({
      ...ORIGIN,
      locale: 'en',
      defaultLocale: 'en',
      id: ID.toUpperCase(),
    }),
    `https://search.wa211.org/search/${ID}`,
  );
});

test("canonical origin: the tenant's first trusted domain, not whichever host the request came in on", () => {
  assert.deepEqual(
    canonicalOrigin({
      trustedDomains: ['search.wa211.org', 'wa211.norse.app'],
      host: 'wa211.norse.app',
      protocol: 'https',
    }),
    { host: 'search.wa211.org', protocol: 'https' },
  );
  assert.deepEqual(
    canonicalOrigin({
      trustedDomains: ['https://Search.WA211.org:443/'],
      host: 'x',
      protocol: 'https',
    }),
    { host: 'search.wa211.org', protocol: 'https' },
  );
  assert.deepEqual(
    canonicalOrigin({
      trustedDomains: [],
      host: 'localhost',
      protocol: 'http',
    }),
    { host: 'localhost', protocol: 'http' },
  );
});

test('canonical origin: only the first x-forwarded-proto value counts', () => {
  assert.equal(
    canonicalOrigin({ trustedDomains: [], host: 'h', protocol: 'https, http' })
      .protocol,
    'https',
  );
  assert.equal(
    canonicalOrigin({ trustedDomains: [], host: 'h', protocol: '' }).protocol,
    'https',
  );
});
