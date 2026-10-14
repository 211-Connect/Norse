import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AnalyticsEvent,
  trackSearchEvent,
} from '../src/app/(app)/shared/lib/analytics';
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
