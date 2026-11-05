import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DestinationStream } from 'pino';

import { setLogDestination } from '../src/lib/logger';
import { memoryCache } from '../src/utilities/withCache';

// `constants.ts` reads API_URL at module load; the service is imported below.
process.env.API_URL = 'https://services.test.invalid/norse-api/v1';

// Search text, coordinates and location: none of these may reach a log line.
const SECRET_QUERY = 'SECRETTEXT';
const SECRET_LOCATION = 'location=X';

/** Lines written through the real pino instance (serializers included). */
const lines: string[] = [];
const capture = {
  write(chunk: string) {
    lines.push(chunk);
    return true;
  },
} as unknown as DestinationStream;

// The leak lived in the err serializer, so this test must use the real logger.
// Patching log.error instead would hide exactly what is being tested.
setLogDestination(capture);

const TENANT_V1 = 'tenant-1';
const TENANT_V2 = 'tenant-2';

// A cached tenant API key keeps getApiHeaders() from initialising Payload, so
// the request reaches fetch() and throws a real FetchError.
memoryCache.set(`tenant_api_key:${TENANT_V1}`, JSON.stringify('test-key'));
memoryCache.set(`tenant_api_key:${TENANT_V2}`, JSON.stringify('test-key'));

const requestedUrls: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  requestedUrls.push(input instanceof Request ? input.url : String(input));
  // Non-2xx on purpose: `fetchWrapper` turns it into a FetchError whose
  // message embeds the request URL with its query string.
  return new Response(
    JSON.stringify({ error: 'upstream rejected the request' }),
    {
      status: 400,
      statusText: 'Bad Request',
      headers: { 'content-type': 'application/json' },
    },
  );
}) as typeof fetch;

const { findResources, findResourcesV2 } =
  await import('../src/app/(app)/shared/services/search-service');

const FORBIDDEN = [SECRET_QUERY, 'coords=', 'location=', 'query='];

type LogEntry = Record<string, unknown> & { msg?: string };

function linesSince(index: number): string[] {
  return lines.slice(index).filter((line) => line.trim() !== '');
}

function parse(entries: string[]): LogEntry[] {
  return entries.map((line) => JSON.parse(line) as LogEntry);
}

function assertNoSearchText(entries: LogEntry[]) {
  const serialized = JSON.stringify(entries);
  for (const secret of FORBIDDEN) {
    assert.ok(
      !serialized.includes(secret),
      `log line must not contain "${secret}": ${serialized}`,
    );
  }
  for (const entry of entries) {
    assert.ok(!('err' in entry), 'the raw error object must not be logged');
  }
}

test('v1 failure logs no search text through the real logger', async () => {
  const before = lines.length;
  await findResources(
    {
      query: SECRET_QUERY,
      queryLabel: SECRET_QUERY,
      location: 'X',
      coordinates: [1, 2],
    },
    'en',
    2,
    10,
    TENANT_V1,
    'postgres' as never,
  );

  // Sanity check: the failing request URL really carried the secrets.
  const url = requestedUrls.at(-1) ?? '';
  for (const secret of [
    `query=${SECRET_QUERY}`,
    'coords=1%2C2',
    SECRET_LOCATION,
  ]) {
    assert.ok(
      url.includes(secret),
      `expected request URL to contain ${secret}`,
    );
  }

  const entries = parse(linesSince(before));
  assert.ok(entries.length > 0, 'expected at least one log line');
  assertNoSearchText(entries);

  const errorEntry = entries.find((entry) => entry.msg === 'Search API error');
  assert.ok(errorEntry, 'expected the search error line');
  assert.equal(errorEntry.api, 'v1');
  assert.equal(errorEntry.errName, 'FetchError');
  assert.equal(errorEntry.status, 400);
  assert.equal(errorEntry.tenantId, TENANT_V1);
  assert.equal(errorEntry.page, 2);
});

test('v2 failure logs no search text through the real logger', async () => {
  const before = lines.length;
  await findResourcesV2(
    {
      query: SECRET_QUERY,
      queryLabel: SECRET_QUERY,
      location: 'X',
      coordinates: [1, 2],
      distance: '5',
    },
    'en',
    3,
    undefined,
    TENANT_V2,
    'postgres' as never,
  );

  const url = requestedUrls.at(-1) ?? '';
  for (const secret of [
    `query=${SECRET_QUERY}`,
    'coords=1%2C2',
    SECRET_LOCATION,
  ]) {
    assert.ok(
      url.includes(secret),
      `expected request URL to contain ${secret}`,
    );
  }

  const entries = parse(linesSince(before));
  assert.ok(entries.length > 0, 'expected at least one log line');
  assertNoSearchText(entries);

  const errorEntry = entries.find(
    (entry) => entry.msg === 'Search API error (V2)',
  );
  assert.ok(errorEntry, 'expected the search error line');
  assert.equal(errorEntry.api, 'v2');
  assert.equal(errorEntry.errName, 'FetchError');
  assert.equal(errorEntry.status, 400);
  assert.equal(errorEntry.tenantId, TENANT_V2);
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
