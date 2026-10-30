import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { describeError } from '../src/lib/describe-error';
import { maskSecret, redactUrl } from '../src/lib/redact';

const SECRET = 'Fak3sEcretValueForTests0nlyNotARealKey123=';

describe('maskSecret', () => {
  test('keeps the first and last 4 characters', () => {
    assert.equal(maskSecret(SECRET), 'Fak3…123=');
  });

  test('fully masks short values and returns empty for missing ones', () => {
    assert.equal(maskSecret('short-value'), '***');
    assert.equal(maskSecret(undefined), '');
  });
});

describe('redactUrl', () => {
  test('masks the secret query parameter and keeps the rest', () => {
    const redacted = redactUrl(
      `https://search.auw211.org/api/getTenantBasicConfig?host=search.auw211.org&secret=${encodeURIComponent(SECRET)}`,
    );
    assert.ok(!redacted.includes(SECRET));
    assert.ok(!redacted.includes(encodeURIComponent(SECRET)));
    assert.equal(new URL(redacted).searchParams.get('secret'), 'Fak3…123=');
    assert.equal(
      new URL(redacted).searchParams.get('host'),
      'search.auw211.org',
    );
  });

  test('returns URLs without secrets and non-URLs unchanged', () => {
    assert.equal(
      redactUrl('https://a.test/x?host=b'),
      'https://a.test/x?host=b',
    );
    assert.equal(redactUrl('not a url'), 'not a url');
  });
});

describe('describeError', () => {
  test('keeps the status and body of a Response thrown by the SDK', () => {
    const response = Object.assign(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
      { error: { message: 'Unknown tenant', statusCode: 403 } },
    );
    const fields = describeError(response);
    assert.equal(fields.error, 'HTTP 403 Forbidden');
    assert.equal(fields.status, 403);
    assert.equal(fields.body, '{"message":"Unknown tenant","statusCode":403}');
  });

  test('includes the network cause of a fetch failure', () => {
    const error = new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
      }),
    });
    assert.deepEqual(describeError(error), {
      error: 'fetch failed',
      errorName: 'TypeError',
      errorCause: 'ECONNREFUSED',
    });
  });

  test('falls back to String for anything else', () => {
    assert.deepEqual(describeError('boom'), { error: 'boom' });
  });
});
