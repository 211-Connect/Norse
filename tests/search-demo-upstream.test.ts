// The demo stub forwards the page's v2 parameters to the live Norse-API (sort, distance, area, filters).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { upstreamV2Url } from '../prototype/v2-upstream';

const env = { upstream: 'http://up.test', tenant: 'live-tenant' };
const up = (search: string, e: Parameters<typeof upstreamV2Url>[1] = env) =>
  upstreamV2Url(new URLSearchParams(search), e).searchParams;

test('sort=name and sort=organization reach the upstream URL', () => {
  assert.equal(up('query=food&sort=name').get('sort'), 'name');
  assert.equal(up('query=food&sort=organization').get('sort'), 'organization');
});

test('distance, location, region, area_match and filters are forwarded', () => {
  const p = up(
    'query=food&distance=10&location=Rochester&region=r1&area_match=a&filters[languages]=Spanish&page=2&limit=5',
  );
  assert.equal(p.get('distance'), '10');
  assert.equal(p.get('location'), 'Rochester');
  assert.equal(p.get('region'), 'r1');
  assert.equal(p.get('area_match'), 'a');
  assert.equal(p.get('filters[languages]'), 'Spanish');
  assert.equal(p.get('page'), '2');
  assert.equal(p.get('limit'), '5');
});

test('taxonomy N- codes become needs; other taxonomy codes are forwarded', () => {
  const p = up('query=food&taxonomy=N-FOD&taxonomy=BD-1800');
  assert.equal(p.get('needs'), 'N-FOD');
  assert.deepEqual(p.getAll('taxonomy'), ['BD-1800']);
  assert.equal(up('query=food&taxonomy=N-FOD').has('taxonomy'), false);
});

test('tenant and locale: the tenant comes from the env, the locale from the page', () => {
  const p = up('query=food&tenant_id=page-tenant&locale=es');
  assert.equal(p.get('tenant_id'), 'live-tenant');
  assert.equal(p.get('locale'), 'es');
  assert.equal(up('query=food').get('locale'), 'en');
});

test('env coords fill in only with no coords and no region; page coords win', () => {
  const withEnv = { ...env, coords: '-1,2' };
  assert.equal(up('query=food', withEnv).get('coords'), '-1,2');
  assert.equal(up('query=food&coords=-5,6', withEnv).get('coords'), '-5,6');
  assert.equal(up('query=food&region=r1', withEnv).has('coords'), false);
});

test('relevance_cutoff is off unless the env says on; the page cannot set it', () => {
  assert.equal(up('query=food').get('relevance_cutoff'), 'off');
  assert.equal(
    up('query=food&relevance_cutoff=on').get('relevance_cutoff'),
    'off',
  );
  assert.equal(
    up('query=food', { ...env, cutoff: 'on' }).get('relevance_cutoff'),
    'on',
  );
});

test('needs, passed_needs, urgency and clarify keep the stub rules', () => {
  const p = up(
    'query=food&needs=N-FOD,N-HOU&passed_needs=N-X&urgency=U-3&clarify=never',
  );
  assert.equal(p.get('needs'), 'N-FOD,N-HOU');
  assert.equal(p.get('passed_needs'), 'N-X');
  assert.equal(p.get('urgency'), 'U-3');
  assert.equal(p.get('clarify'), 'never');
  assert.equal(p.getAll('needs').length, 1);
});
