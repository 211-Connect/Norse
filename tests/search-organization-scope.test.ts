// ISS-2474: an organization scope only ever means "show this organization's services". A search with a
// typed query is a new search of the whole directory, never a search within one organization, whether the
// query and the organization arrive together in a URL (a printable-directory source, a shared link) or a
// writer is handed both.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  liftQueryString,
  toFindResourcesQuery,
} from '../src/app/(app)/features/search/intent';
import { buildSearchUrl } from '../src/app/(app)/features/search/utils/buildSearchUrl';

const searchedFor = (query: string) =>
  toFindResourcesQuery(liftQueryString(query).intent);

test('a URL with a query and an organization searches the whole directory', () => {
  const search = searchedFor(
    'query=food&query_type=text&organization_id=org-1',
  );
  assert.equal(search.query, 'food');
  assert.equal(search.organizationId, undefined);
});

test('an organization link with no query still shows that organization', () => {
  const search = searchedFor(
    'query_label=OlyCAP&query_type=text&organization_id=org-1',
  );
  assert.equal(search.organizationId, 'org-1');
  assert.equal(search.query, undefined);
});

test('a writer given a query and an organization writes no organization', () => {
  const url = new URL(
    buildSearchUrl({
      query: 'food',
      queryLabel: 'food',
      organizationId: 'org-1',
      searchEngine: 'classic',
    }),
    'https://example.org',
  );
  assert.equal(url.searchParams.get('query'), 'food');
  assert.equal(url.searchParams.get('organization_id'), null);
});

test('a writer given only an organization keeps it', () => {
  const url = new URL(
    buildSearchUrl({
      query: '',
      queryLabel: 'OlyCAP',
      organizationId: 'org-1',
      searchEngine: 'classic',
    }),
    'https://example.org',
  );
  assert.equal(url.searchParams.get('organization_id'), 'org-1');
  assert.equal(url.searchParams.get('query'), null);
});
