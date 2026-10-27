import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  redirectIfOrganizationRekeyed,
  searchUrlWithOrganization,
} from '../src/app/(app)/features/search/utils/organizationRedirect';
import { Organization } from '../src/lib/api/generated/Organization';

/**
 * An organization-scoped search link after a re-key (ISS-2517). The lookup
 * is the real generated SDK client, fed the 404 Norse-API's
 * HttpExceptionFilter writes; the redirect is the real `next/navigation` one,
 * which signals by throwing an error whose digest names target and status.
 */

const OLD_ORG = '550e8400-e29b-41d4-a716-446655440000';
const NEW_ORG = '0f1e2d3c-4b5a-4968-8776-655443322110';

function lookupAnswering(status: number, body: unknown) {
  const client = new Organization({
    baseUrl: 'http://norse-api.test',
    customFetch: async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  });
  return (id: string) =>
    client.organizationControllerGetOrganizationById({ id });
}

const notFound = (extra: Record<string, unknown> = {}) => ({
  status: 404,
  message: 'Not Found',
  path: `/organization/${OLD_ORG}`,
  method: 'GET',
  tenant: 'aaaaaaaa-1111-4111-8111-111111111111',
  ...extra,
});

/** The NEXT_REDIRECT digest the call threw, or null if it returned. */
async function digestOf(run: () => Promise<void>): Promise<string | null> {
  try {
    await run();
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

const rawParams = {
  query: 'food bank',
  query_type: 'text',
  organization_id: OLD_ORG,
  location: 'Bellingham, WA',
  coords: '-122.47,48.75',
  'filters[languages][0]': 'Spanish',
  page: '2',
};

test('a re-keyed organization id -> 308 to the same search with the new id, every other parameter kept', async () => {
  const digest = await digestOf(() =>
    redirectIfOrganizationRekeyed({
      organizationId: OLD_ORG,
      rawParams,
      locale: 'es',
      lookup: lookupAnswering(
        404,
        notFound({ redirect: `/search?organization_id=${NEW_ORG}` }),
      ),
    }),
  );

  assert.ok(digest, 'expected a redirect');
  const [, mode, target, status] = digest.split(';');
  assert.equal(mode, 'replace');
  assert.equal(status, '308');

  const url = new URL(target, 'http://norse.test');
  assert.equal(url.pathname, '/es/search');
  assert.deepEqual(
    [...url.searchParams],
    Object.entries({ ...rawParams, organization_id: NEW_ORG }),
  );
});

test('an unknown organization id with no redirect -> no redirect (behaves as today)', async () => {
  const digest = await digestOf(() =>
    redirectIfOrganizationRekeyed({
      organizationId: OLD_ORG,
      rawParams,
      locale: 'en',
      lookup: lookupAnswering(404, notFound()),
    }),
  );
  assert.equal(digest, null);
});

test('an organization that exists -> no redirect', async () => {
  const digest = await digestOf(() =>
    redirectIfOrganizationRekeyed({
      organizationId: OLD_ORG,
      rawParams,
      locale: 'en',
      lookup: lookupAnswering(200, { organizationId: OLD_ORG }),
    }),
  );
  assert.equal(digest, null);
});

test('a failed lookup -> no redirect and no error: the search renders as today', async () => {
  const digest = await digestOf(() =>
    redirectIfOrganizationRekeyed({
      organizationId: OLD_ORG,
      rawParams,
      locale: 'en',
      lookup: lookupAnswering(
        500,
        notFound({ redirect: `/search?organization_id=${NEW_ORG}` }),
      ),
    }),
  );
  assert.equal(digest, null);
});

test('a redirect that is not an org-scoped search is not followed', async () => {
  for (const redirect of [
    `/search/${NEW_ORG}`,
    `/search?query=x`,
    `//evil.example/search?organization_id=${NEW_ORG}`,
    `/elsewhere?organization_id=${NEW_ORG}`,
  ]) {
    const digest = await digestOf(() =>
      redirectIfOrganizationRekeyed({
        organizationId: OLD_ORG,
        rawParams,
        locale: 'en',
        lookup: lookupAnswering(404, notFound({ redirect })),
      }),
    );
    assert.equal(digest, null, `followed ${redirect}`);
  }
});

test('the rewritten URL keeps order, repeated keys and values that are not the old id', () => {
  const url = searchUrlWithOrganization(
    {
      taxonomy: ['BD-1800', 'BD-1800.2000'],
      organization_id: OLD_ORG,
      'filters[x][0]': 'a b&c',
    },
    OLD_ORG,
    NEW_ORG,
    'en',
  );
  const parsed = new URL(url, 'http://norse.test');
  assert.equal(parsed.pathname, '/en/search');
  assert.deepEqual(
    [...parsed.searchParams],
    [
      ['taxonomy', 'BD-1800'],
      ['taxonomy', 'BD-1800.2000'],
      ['organization_id', NEW_ORG],
      ['filters[x][0]', 'a b&c'],
    ],
  );
});
