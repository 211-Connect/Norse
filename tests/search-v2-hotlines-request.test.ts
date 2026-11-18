import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_HOTLINES,
  hotlinesOf,
} from '../src/app/(app)/features/search/v2/v2-contract';
import {
  buildV2Headers,
  buildV2Url,
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

test('hotlinesOf: absent, empty or malformed gives 988 then 911', () => {
  for (const q of [undefined, {}, { hotlines: [] }, { hotlines: [{ label: 'x' }] }]) {
    assert.deepEqual(hotlinesOf(q as never), DEFAULT_HOTLINES);
  }
  assert.deepEqual(
    DEFAULT_HOTLINES.map((h) => h.number),
    ['988', '911'],
  );
});

test('buildV2Url: tenant_id and locale are in the URL, locale defaults to en', () => {
  const page = new URLSearchParams({ query: 'food', needs: 'N-FOD', junk: 'x', tenant_id: 'stub' });
  const url = new URL(buildV2Url('http://api', page, 'T-1'));
  assert.equal(url.pathname, '/v2/search');
  assert.equal(url.searchParams.get('tenant_id'), 'T-1');
  assert.equal(url.searchParams.get('locale'), 'en');
  assert.equal(url.searchParams.get('query'), 'food');
  assert.equal(url.searchParams.get('junk'), null);
  const es = new URL(buildV2Url('http://api', new URLSearchParams({ locale: 'es' }), 'T-1'));
  assert.equal(es.searchParams.get('locale'), 'es');
});

test('buildV2Headers: no tenant or language header, only the api key', () => {
  assert.deepEqual(buildV2Headers('k'), { 'x-api-key': 'k' });
  assert.deepEqual(buildV2Headers(null), {});
});
