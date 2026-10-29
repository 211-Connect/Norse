import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isNorseApiNotFound,
  redirectIfRekeyed,
} from '../src/app/(app)/shared/lib/rekeyedRedirect';
import { Resource } from '../src/lib/api/generated/Resource';

/**
 * A re-keyed resource's old deep link (ISS-2514). The error comes from the
 * real generated SDK client, fed a 404 shaped like the one Norse-API's
 * HttpExceptionFilter writes, so the check reads the error type the SDK
 * actually throws, not the legacy FetchError the pages once tested for.
 * The redirect is the real `next/navigation` one, which signals by throwing
 * an error whose digest names the target and the status.
 */

const NEW_ID = '0f1e2d3c-4b5a-4968-8776-655443322110';
const OLD_ID = '550e8400-e29b-41d4-a716-446655440000';

function clientAnswering(status: number, body: unknown) {
  return new Resource({
    baseUrl: 'http://norse-api.test',
    customFetch: async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  });
}

async function sdkError(status: number, body: unknown): Promise<unknown> {
  try {
    await clientAnswering(status, body).resourceControllerGetResourceById({
      id: OLD_ID,
    });
  } catch (err) {
    return err;
  }
  assert.fail('the generated client did not throw');
}

/** The NEXT_REDIRECT digest redirectIfRekeyed threw, or null if it returned. */
function redirectDigest(err: unknown, locale = 'en'): string | null {
  try {
    redirectIfRekeyed(err, locale);
    return null;
  } catch (thrown) {
    const digest = (thrown as { digest?: string }).digest;
    assert.ok(
      digest?.startsWith('NEXT_REDIRECT;'),
      `not a redirect: ${thrown}`,
    );
    return digest ?? null;
  }
}

const notFoundBody = (extra: Record<string, unknown> = {}) => ({
  status: 404,
  message: 'Not Found',
  path: `/resource/${OLD_ID}`,
  method: 'GET',
  tenant: 'aaaaaaaa-1111-4111-8111-111111111111',
  ...extra,
});

test('missed id with a redirect -> 308 to the new id, under the locale', async () => {
  const err = await sdkError(
    404,
    notFoundBody({ redirect: `/search/${NEW_ID}` }),
  );

  assert.equal(
    redirectDigest(err, 'es'),
    `NEXT_REDIRECT;replace;/es/search/${NEW_ID};308;`,
  );
});

test('missed id without a redirect -> no redirect, and it reads as a 404', async () => {
  const err = await sdkError(404, notFoundBody());

  assert.equal(redirectDigest(err), null);
  assert.equal(isNorseApiNotFound(err), true);
});

test('a redirect row for another tenant reaches Norse as a plain 404 -> no redirect', async () => {
  // Norse-API scopes the lookup by tenant, so the other tenant's row yields
  // the body without `redirect`; Norse must not invent one.
  const err = await sdkError(404, notFoundBody({ tenant: 'other' }));

  assert.equal(redirectDigest(err), null);
});

test('a non-404 error carrying redirect is not followed', async () => {
  const err = await sdkError(
    500,
    notFoundBody({ redirect: `/search/${NEW_ID}` }),
  );

  assert.equal(redirectDigest(err), null);
  assert.equal(isNorseApiNotFound(err), false);
});

test('a redirect that is not a same-site path is not followed', async () => {
  for (const redirect of [
    `//evil.example/search/${NEW_ID}`,
    `https://evil.example/search/${NEW_ID}`,
    `/\\evil.example`,
    42,
  ]) {
    const err = await sdkError(404, notFoundBody({ redirect }));
    assert.equal(redirectDigest(err), null, `followed ${String(redirect)}`);
  }
});
