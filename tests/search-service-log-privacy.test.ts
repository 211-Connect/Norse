import assert from 'node:assert/strict';
import { test } from 'node:test';

import { logger } from '../src/lib/logger';

type LogEntry = { data: Record<string, unknown>; msg: string };

// Capture everything logged through createLogger() by patching logger.child
// BEFORE the module under test is imported (it calls createLogger at module
// load time).
const entries: LogEntry[] = [];
// The logger instance is a module singleton; the test deliberately monkey-patches
// it instead of casting, to capture every log call made through createLogger().
const patchable = Object.assign(logger, {
  child: () => {
    const emit = (data: Record<string, unknown>, msg?: string) =>
      entries.push({ data, msg: msg ?? '' });
    return {
      level: 'debug',
      error: (data: Record<string, unknown>, msg?: string) => emit(data, msg),
      warn: (data: Record<string, unknown>, msg?: string) => emit(data, msg),
      info: (data: Record<string, unknown>, msg?: string) => emit(data, msg),
      debug: (data: Record<string, unknown>, msg?: string) => emit(data, msg),
    };
  },
});
void patchable.child; // keep the patched shape referenced

// Dynamic import is load-order dependent: createLogger('search') runs at module
// evaluation, so the logger must be patched before this module is loaded.
const { findResources, findResourcesV2 } = await import(
  '../src/app/(app)/shared/services/search-service'
);

// Search text that must never appear in any logged object.
const SECRET_QUERY = 'crisis-shelter-search-text-DO-NOT-LOG';
const SECRET_LOCATION = 'secret-location-text';

// Every fetch fails, so both paths take their `log.error` catch.
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  throw new Error('fake failing fetch');
}) as typeof fetch;

const FORBIDDEN_KEYS = [
  'query',
  'query_label',
  'queryLabel',
  'url',
  'searchUrl',
  'location',
  'coords',
  'coordinates',
];

test('v1 error path logs no search text', async () => {
  const before = entries.length;
  await findResources(
    {
      query: SECRET_QUERY,
      queryLabel: SECRET_QUERY,
      location: SECRET_LOCATION,
      coordinates: [52.1, 21.1],
    },
    'en',
    2,
    10,
    'tenant-1',
    'postgres' as never,
  );

  const logged = entries.slice(before).filter((e) => e.msg !== '');
  assert.ok(logged.length > 0, 'expected at least one log call');
  for (const entry of logged) {
    for (const key of FORBIDDEN_KEYS) {
      assert.ok(
        !(key in entry.data),
        `logged object must not contain key "${key}"`,
      );
    }
    assert.equal(entry.data.api, 'v1');
    assert.equal(entry.data.tenantId, 'tenant-1');
    assert.equal(entry.data.page, 2);
    assert.equal(entry.data.limit, 10);
    assert.ok('err' in entry.data);
  }
});

test('v2 error path logs no search text', async () => {
  const before = entries.length;
  await findResourcesV2(
    {
      query: SECRET_QUERY,
      queryLabel: SECRET_QUERY,
      location: SECRET_LOCATION,
      coordinates: [52.1, 21.1],
    },
    'en',
    3,
    undefined,
    'tenant-2',
    'postgres' as never,
  );

  const logged = entries.slice(before).filter((e) => e.msg !== '');
  assert.ok(logged.length > 0, 'expected at least one log call');
  for (const entry of logged) {
    for (const key of FORBIDDEN_KEYS) {
      assert.ok(
        !(key in entry.data),
        `logged object must not contain key "${key}"`,
      );
    }
    assert.equal(entry.data.api, 'v2');
    assert.equal(entry.data.tenantId, 'tenant-2');
    assert.ok('err' in entry.data);
  }
});

test.after?.(() => {
  globalThis.fetch = originalFetch;
});
