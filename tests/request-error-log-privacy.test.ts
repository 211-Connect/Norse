import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DestinationStream } from 'pino';

import { setLogDestination } from '../src/lib/logger';

// Search text in a URL: it must never reach a log line (privacy rule 8).
const SECRET_QUERY = 'SECRET';
const LEAKY_URL = `https://x.example/search?query=${SECRET_QUERY}`;

/** Lines written through the real pino instance (serializers included). */
const lines: string[] = [];
const capture = {
  write(chunk: string) {
    lines.push(chunk);
    return true;
  },
} as unknown as DestinationStream;

// `instrumentation.ts` keeps a child of the logger that exists at import time,
// so the destination has to be installed before the module loads. A static
// import would run before `setLogDestination`, hence the dynamic import.
setLogDestination(capture);

const { onRequestError } = await import('../src/instrumentation');

const request = { path: '/api/search', method: 'GET', headers: {} };
const ctx = {
  routerKind: 'App Router' as const,
  routePath: '/api/search',
  routeType: 'route' as const,
  revalidateReason: undefined,
};

test('onRequestError does not log a URL query string from the error message', async () => {
  const error = new Error(`search request failed: ${LEAKY_URL}`);

  await onRequestError(error, request, ctx);

  const logged = lines.filter((line) => line.includes('request_error'));
  assert.equal(logged.length, 1, 'exactly one request_error line is written');

  const line = logged[0];
  assert.ok(
    !line.includes(SECRET_QUERY),
    `the logged line must not contain the search text: ${line}`,
  );
  assert.ok(
    !line.includes('?'),
    `the logged line must not contain a query string: ${line}`,
  );
  // The URL itself is still useful for debugging, minus its query string.
  assert.ok(
    line.includes('https://x.example/search'),
    `the sanitised URL stays in the message: ${line}`,
  );
});
