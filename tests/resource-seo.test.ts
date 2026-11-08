// ISS-2678 (from ISS-2672): resource detail pages tell search engines their own URL (canonical, decided
// 2026-11-06: every page's canonical points to itself) and what the resource is (schema.org JSON-LD), from the
// record's own fields only.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  jsonLdScript,
  resourceCanonicalUrl,
  resourceJsonLd,
} from '../src/app/(app)/features/resource/seo/resourceSeo';
import type { Resource } from '../src/types/resource';

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

const FULL: Partial<Resource> = {
  id: ID,
  name: 'FINANCIAL AND FOOD ASSISTANCE | EXAMPLE ORGANIZATION',
  serviceName: 'FINANCIAL AND FOOD ASSISTANCE',
  description: 'Emergency financial assistance.',
  organizationName: 'EXAMPLE ORGANIZATION',
  organizationUrl: 'https://www.example.org/',
  website: 'https://www.example.com/',
  phone: '(555) 555-5555',
  email: 'info@example.com',
  locationName: 'Main Office',
  addresses: [
    {
      address_1: '543 East Connect Street',
      address_2: 'Suite 2',
      city: 'Example',
      stateProvince: 'WA',
      postalCode: '99032',
      country: 'United States',
      type: 'physical',
      rank: 1,
    },
  ],
  location: { coordinates: [-106.0746, 42.1485] },
  hours:
    'Monday 11:00am - 4:30pm;Tuesday 11:00am - 6:00pm;Wednesday 11:00am - 4:30pm;Thursday 11:00am - 6:00pm',
};

const URL_ = `https://search.wa211.org/search/${ID}`;

test('JSON-LD: a Service provided by an Organization, with phone and address', () => {
  const ld = resourceJsonLd(FULL as Resource, URL_) as Record<string, any>;
  assert.equal(ld['@context'], 'https://schema.org');
  assert.equal(ld['@type'], 'Service');
  assert.equal(ld.name, 'FINANCIAL AND FOOD ASSISTANCE');
  assert.equal(ld.url, URL_);
  assert.equal(ld.description, 'Emergency financial assistance.');
  assert.deepEqual(ld.provider, {
    '@type': 'Organization',
    name: 'EXAMPLE ORGANIZATION',
    url: 'https://www.example.org/',
  });
  const channel = ld.availableChannel;
  assert.equal(channel['@type'], 'ServiceChannel');
  assert.equal(channel.serviceUrl, 'https://www.example.com/');
  assert.deepEqual(channel.servicePhone, {
    '@type': 'ContactPoint',
    telephone: '(555) 555-5555',
    email: 'info@example.com',
  });
  assert.deepEqual(channel.serviceLocation, {
    '@type': 'Place',
    name: 'Main Office',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '543 East Connect Street, Suite 2',
      addressLocality: 'Example',
      addressRegion: 'WA',
      postalCode: '99032',
      addressCountry: 'United States',
    },
  });
  // No coordinates: a real WA211 record (005f16ab…) carries central-Seattle coordinates for a Des Moines
  // address, and the address alone identifies the place.
  assert.equal(JSON.stringify(ld).includes('GeoCoordinates'), false);
  // No hours: the resource record carries hours only as display text, and the markup takes no parsed text
  // (decided 2026-11-07). Hours return once structured schedules reach the resource record.
  assert.equal(ld.hoursAvailable, undefined);
  assert.ok(!JSON.stringify(ld).includes('OpeningHours'));
});

test('JSON-LD: absent fields are left out, never written as null or empty', () => {
  const ld = resourceJsonLd(
    {
      id: ID,
      name: 'Food Pantry',
      serviceName: null,
      organizationName: null,
    } as Resource,
    URL_,
  ) as Record<string, any>;
  assert.deepEqual(ld, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Food Pantry',
    url: URL_,
  });
  assert.ok(!JSON.stringify(ld).includes('null'));
});

test('JSON-LD: a record with nothing to name it has no JSON-LD', () => {
  assert.equal(resourceJsonLd({ id: ID } as Resource, URL_), undefined);
});

test('JSON-LD: hours text never becomes opening hours, whatever its format', () => {
  for (const hours of [
    'M-F, 8am-5pm.',
    '24 hours daily.',
    'Monday 11:00am - 4:30pm;Tuesday 11:00am - 6:00pm',
    'Office: M-F, 9am-4pm. Toll Free Number: 8am-7pm.',
  ]) {
    const ld = resourceJsonLd({ ...FULL, hours } as Resource, URL_) as Record<
      string,
      any
    >;
    assert.equal(ld.hoursAvailable, undefined, hours);
  }
});

test('the script cannot be closed by record text, and reads back to the same data', () => {
  const hostile = {
    ...FULL,
    serviceName: '</script><script>alert(1)</script> & <!-- \u2028',
  } as Resource;
  const ld = resourceJsonLd(hostile, URL_)!;
  const script = jsonLdScript(ld);
  assert.ok(!/<\/?script/i.test(script), script);
  assert.ok(!script.includes('<!--'));
  assert.ok(!script.includes('\u2028'));
  assert.deepEqual(JSON.parse(script), ld);
});
