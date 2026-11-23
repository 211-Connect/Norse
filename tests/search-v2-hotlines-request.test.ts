import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  hotlinesOf,
} from '../src/app/(app)/features/search/v2/v2-contract';
import {
  buildV2Headers,
  buildV2Url,
  relayV2Response,
} from '../src/app/(app)/features/search/v2/v2-request';

test('hotlinesOf: tenant hotlines from the response win, trimmed, at most 4', () => {
  const hotlines = [
    { label: ' Line A ', number: ' 111 ' },
    { label: 'B', number: '222' },
    { label: '', number: '333' },
    { label: 'D', number: '444' },
    { label: 'E', number: '555' },
    { label: 'F', number: '666' },
  ];
  assert.deepEqual(hotlinesOf({ hotlines }), [
    { label: 'Line A', number: '111' },
    { label: 'B', number: '222' },
    { label: 'D', number: '444' },
    { label: 'E', number: '555' },
  ]);
});

test('hotlinesOf: absent, empty or malformed gives none (no UI default list)', () => {
  for (const q of [
    undefined,
    {},
    { hotlines: [] },
    { hotlines: [{ label: 'x' }] },
  ]) {
    assert.deepEqual(hotlinesOf(q as never), []);
  }
});

test('buildV2Url: tenant_id and locale are in the URL, locale defaults to en', () => {
  const page = new URLSearchParams({
    query: 'food',
    needs: 'N-FOD',
    junk: 'x',
    tenant_id: 'stub',
  });
  const url = new URL(buildV2Url('http://api', page, 'T-1'));
  assert.equal(url.pathname, '/v2/search');
  assert.equal(url.searchParams.get('tenant_id'), 'T-1');
  assert.equal(url.searchParams.get('locale'), 'en');
  assert.equal(url.searchParams.get('query'), 'food');
  assert.equal(url.searchParams.get('junk'), null);
  const es = new URL(
    buildV2Url('http://api', new URLSearchParams({ locale: 'es' }), 'T-1'),
  );
  assert.equal(es.searchParams.get('locale'), 'es');
});

test('buildV2Headers: no tenant or language header, only the api key', () => {
  assert.deepEqual(buildV2Headers('k'), { 'x-api-key': 'k' });
  assert.deepEqual(buildV2Headers(null), {});
});

test('relayV2Response: a 4xx passes through with its status and body; 5xx and network failure stay 502', async () => {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status });
  assert.deepStrictEqual(await relayV2Response(json({ a: 1 }, 200)), {
    status: 200,
    body: { a: 1 },
  });
  assert.deepStrictEqual(
    await relayV2Response(json({ error: 'needs=N-X is not allowed' }, 400)),
    { status: 400, body: { error: 'needs=N-X is not allowed' } },
  );
  assert.equal(
    (await relayV2Response(new Response('not json', { status: 422 }))).status,
    422,
  );
  assert.deepStrictEqual(
    (await relayV2Response(new Response('', { status: 404 }))).body,
    {
      error: 'v2 search failed',
      status: 404,
    },
  );
  assert.equal((await relayV2Response(json({}, 500))).status, 502);
  assert.equal((await relayV2Response(json({}, 503))).status, 502);
  assert.deepStrictEqual(await relayV2Response(null), {
    status: 502,
    body: { error: 'v2 search failed', status: 0 },
  });
});
