import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getCookie } from 'cookies-next/client';

import {
  AnalyticsEvent,
  trackSearchEvent,
} from '../src/app/(app)/shared/lib/analytics';
import { buildSearchLocationPayload } from '../src/app/(app)/shared/lib/search-location-meta';
import { setLocationCookies } from '../src/app/(app)/shared/lib/location-cookies';
import { buildSearchUrl } from '../src/app/(app)/features/search/utils/buildSearchUrl';

type UmamiEvent = { event: string; payload?: Record<string, string> };

function captureUmamiEvents(run: (events: UmamiEvent[]) => void): void {
  const originalWindow = globalThis.window;
  const events: UmamiEvent[] = [];

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      umami: {
        track: (event: string, payload?: Record<string, string>) =>
          events.push({ event, payload }),
      },
    },
  });

  try {
    run(events);
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  }
}

function withCookieJar(run: () => void): void {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document',
  );
  const cookieJar = new Map<string, string>();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      get cookie() {
        return [...cookieJar]
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
      },
      set cookie(serialized: string) {
        const [pair, ...attributes] = serialized.split('; ');
        const separator = pair.indexOf('=');
        const name = pair.slice(0, separator);
        const value = pair.slice(separator + 1);
        const maxAge = attributes.find((attribute) =>
          attribute.startsWith('Max-Age='),
        );
        if (maxAge && Number(maxAge.slice('Max-Age='.length)) <= 0) {
          cookieJar.delete(name);
        } else {
          cookieJar.set(name, value);
        }
      },
    },
  });

  try {
    run();
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', originalDocument);
    } else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  }
}

test('free-text search on the hybrid engine emits the hybrid Umami event', () => {
  const url = buildSearchUrl({
    query: 'food',
    queryType: 'text',
    searchEngine: 'hybrid',
  });
  const queryType =
    new URL(url, 'http://localhost').searchParams.get('query_type') ??
    undefined;

  captureUmamiEvents((events) => {
    trackSearchEvent(queryType, { query: 'food' }, 'session-123');
    assert.deepEqual(events, [
      {
        event: AnalyticsEvent.SearchHybrid,
        payload: { query: 'food', session_id: 'session-123' },
      },
    ]);
  });
});

test('AI-classification navigation emits a hybrid Umami event', () => {
  const url = buildSearchUrl({
    query: 'food',
    searchEngine: 'ai_classification',
  });
  const queryType =
    new URL(url, 'http://localhost').searchParams.get('query_type') ??
    undefined;

  captureUmamiEvents((events) => {
    trackSearchEvent(queryType, { query: 'food' });
    assert.deepEqual(events, [
      {
        event: AnalyticsEvent.SearchHybrid,
        payload: { query: 'food' },
      },
    ]);
  });
});
test('search analytics reuses selected forward-geocode metadata', async () => {
  const payload = await buildSearchLocationPayload(
    [-87.6298, 41.8781],
    [],
    'tenant-1',
    null,
    {
      coordinates: [-87.6298, 41.8781],
      place: 'Chicago',
      postcode: '60601',
      district: 'Cook County',
    },
  );

  assert.deepEqual(
    [payload.searchCity, payload.searchZipCode, payload.searchCounty],
    ['Chicago', '60601', 'Cook County'],
  );
});

test('search analytics scopes selected geocoder metadata to an area', async () => {
  const payload = await buildSearchLocationPayload(
    [-87.6298, 41.8781],
    [],
    'tenant-1',
    'county:53033',
    {
      coordinates: [-87.6298, 41.8781],
      place: 'Chicago',
      postcode: '60601',
      district: 'Cook County',
    },
  );

  assert.deepEqual(
    [payload.searchCity, payload.searchZipCode, payload.searchCounty],
    ['', '', 'Cook County'],
  );
});

test('location preference cookies follow the selected geocode metadata', () => {
  withCookieJar(() => {
    setLocationCookies('Chicago', {
      type: 'coordinates',
      address: 'Chicago, IL, USA',
      coordinates: [-87.6298, 41.8781],
      country: 'United States',
      district: 'Cook County',
      place: 'Chicago',
      postcode: '60601',
      region: 'Illinois',
      region_id: 'county:53033',
      place_type: ['place'],
    });

    assert.equal(getCookie('user-pref-place'), 'Chicago');
    assert.equal(getCookie('user-pref-postcode'), '60601');
    assert.equal(getCookie('user-pref-district'), 'Cook County');

    setLocationCookies('Evanston', {
      type: 'coordinates',
      address: 'Evanston, IL, USA',
      coordinates: [-87.6877, 42.0451],
      place: 'Evanston',
      place_type: ['place'],
    });

    assert.equal(getCookie('user-pref-place'), 'Evanston');
    assert.equal(getCookie('user-pref-postcode'), undefined);
    assert.equal(getCookie('user-pref-district'), undefined);
    assert.equal(getCookie('user-pref-region'), undefined);
    assert.equal(getCookie('user-pref-region-id'), undefined);
  });
});
