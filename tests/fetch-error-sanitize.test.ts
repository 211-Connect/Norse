import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FetchError } from '../src/app/(app)/shared/lib/fetchError';

const SECRET_QUERY = 'SECRETTEXT';
const SECRET_LOCATION = 'never-log-location';
const FAILING_URL =
  `https://services.c211.io/norse-api/v1/search?query=${SECRET_QUERY}` +
  `&coords=1,2&location=${SECRET_LOCATION}&taxonomy=a,b&filters[x]=y#fragment`;

const SAFE_URL = 'https://services.c211.io/norse-api/v1/search';

const FORBIDDEN = [
  SECRET_QUERY,
  SECRET_LOCATION,
  'query=',
  'coords=',
  'location=',
  'taxonomy=',
  'filters=',
  '#fragment',
];

function assertNoQueryText(haystack: string, where: string) {
  for (const secret of FORBIDDEN) {
    assert.ok(
      !haystack.includes(secret),
      `${where} must not contain "${secret}"`,
    );
  }
}

test('FetchError keeps only origin + pathname in message and response.url', () => {
  const error = new FetchError({
    url: FAILING_URL,
    status: 429,
    statusText: 'Too Many Requests',
    data: { error: SECRET_QUERY },
  });

  assert.equal(error.response.url, SAFE_URL);
  assert.ok(error.message.includes(SAFE_URL));
  assert.match(error.message, /HTTP error! status: 429 Too Many Requests/);
  assertNoQueryText(error.message, 'message');
  assertNoQueryText(JSON.stringify(error), 'JSON.stringify(error)');

  // Still available to callers that surface the upstream message in the UI.
  assert.equal(error.response.status, 429);
  assert.equal(error.response.statusText, 'Too Many Requests');
  assert.equal(error.response.data?.error, SECRET_QUERY);
});

test('FetchError response is non-enumerable so the err serializer cannot print it', () => {
  const error = new FetchError({
    url: FAILING_URL,
    status: 500,
    statusText: 'Internal Server Error',
  });

  assert.ok(!Object.keys(error).includes('response'));
  assert.deepEqual(Object.keys(error), ['name']);
  assert.equal(JSON.stringify(error), '{"name":"FetchError"}');
  assertNoQueryText(JSON.stringify(error), 'JSON.stringify(error)');
});

test('FetchError sanitises relative URLs too', () => {
  const error = new FetchError({
    url: '/api/search?query=SECRETTEXT&coords=1,2',
    status: 400,
    statusText: 'Bad Request',
  });

  assert.equal(error.response.url, '/api/search');
  assertNoQueryText(error.message, 'message');
});

test('stripUrlQueries removes query strings and fragments from error text', async () => {
  // Imported dynamically so the FetchError assertions still run when the
  // sanitizer is missing (i.e. before the fix).
  const { stripUrlQueries } = await import('../src/lib/logger');
  const text = `request failed (${FAILING_URL}) at https://a.example/x?k=v#h`;
  const stripped = stripUrlQueries(text);

  assert.equal(
    stripped,
    'request failed (https://services.c211.io/norse-api/v1/search) at https://a.example/x',
  );
  assertNoQueryText(stripped, 'stripped text');
  assert.ok(!stripped.includes('k=v'));
});
