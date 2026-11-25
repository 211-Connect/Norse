import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildV2Url,
  v2ApiPath,
} from '../src/app/(app)/features/search/v2/v2-request';

test('buildV2Url forwards the incoming limit', () => {
  const url = buildV2Url(
    'http://api',
    new URLSearchParams('query=food&limit=10'),
    't1',
  );
  assert.equal(new URL(url).searchParams.get('limit'), '10');
});

test('v2ApiPath puts the limit before the call string', () => {
  assert.equal(
    v2ApiPath('t1', 'query=food', 10),
    '/api/v2-search?tenant_id=t1&limit=10&query=food',
  );
});

test('v2ApiPath leaves out a missing or non-positive limit', () => {
  assert.equal(
    v2ApiPath('t1', 'query=food'),
    '/api/v2-search?tenant_id=t1&query=food',
  );
  assert.equal(
    v2ApiPath('t1', 'query=food', 0),
    '/api/v2-search?tenant_id=t1&query=food',
  );
  assert.equal(v2ApiPath(undefined, ''), '/api/v2-search?tenant_id=');
});

test('v2ApiPath sends the page locale as it is, never lower-cased', () => {
  assert.equal(
    v2ApiPath('t1', 'query=food', undefined, 'es'),
    '/api/v2-search?tenant_id=t1&locale=es&query=food',
  );
  assert.equal(
    v2ApiPath('t1', 'query=food', 10, 'pt-BR'),
    '/api/v2-search?tenant_id=t1&limit=10&locale=pt-BR&query=food',
  );
  assert.equal(
    v2ApiPath('t1', 'query=food', undefined, undefined),
    '/api/v2-search?tenant_id=t1&query=food',
  );
});

test('locale=es from the page reaches the upstream /v2/search URL', () => {
  const page = new URL(
    `http://page${v2ApiPath('t1', 'query=food', undefined, 'es')}`,
  );
  const upstream = new URL(buildV2Url('http://api', page.searchParams, 't1'));
  assert.equal(upstream.searchParams.get('locale'), 'es');
  assert.equal(
    new URL(
      buildV2Url('http://api', new URLSearchParams('query=food'), 't1'),
    ).searchParams.get('locale'),
    'en',
  );
});

test('the locale is part of the v2 cache key and the server fetch passes the route locale', () => {
  const hook = readFileSync(
    'src/app/(app)/features/search/v2/use-v2-search.ts',
    'utf8',
  );
  assert.equal(
    (hook.match(/\['v2-search', tenantId, locale, callString\]/g) ?? []).length,
    2,
    'search hook and prefetch use the same key',
  );
  const server = readFileSync(
    'src/app/(app)/features/search/v2/v2-server.ts',
    'utf8',
  );
  assert.match(server, /locale\?: string/);
  assert.doesNotMatch(server, /toLowerCase/);
});
