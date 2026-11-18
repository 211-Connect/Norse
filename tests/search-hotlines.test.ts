// Per-tenant emergency hotlines for v2 search (ISS-2499, ADR 0039).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isValidHotlineNumber } from '../src/payload/collections/ResourceDirectories/fields/hotlineNumber';
import { buildHybridSearchConfigCache } from '../src/payload/collections/HybridSearchConfig/utilities/buildHybridSearchConfigCache';
import { search as searchTab } from '../src/payload/collections/ResourceDirectories/tabs/search';

test('valid hotline numbers', () => {
  for (const n of [
    '988',
    '911',
    '211',
    '1-800-273-8255',
    '(800) 799-7233',
    '+1 800 799 7233',
    '741741',
    ' 988 ',
  ]) {
    assert.equal(isValidHotlineNumber(n), true, n);
  }
});

test('invalid hotline numbers', () => {
  for (const n of [
    '',
    '   ',
    'abc',
    '9',
    '988x',
    '1-800-CALL-NOW',
    '1234567890123456',
    '98+8',
  ]) {
    assert.equal(isValidHotlineNumber(n), false, n);
  }
});

const directory = (hotlines?: unknown) =>
  ({
    search: { searchSettings: hotlines === undefined ? {} : { hotlines } },
  }) as never;

test('cache keeps hotline order, trims, and drops blank rows', () => {
  const cache = buildHybridSearchConfigCache(
    't1',
    null,
    directory([
      { label: ' Crisis line ', number: ' 988 ', id: 'a' },
      { label: '  ', number: '911' },
      { label: 'Emergency', number: '' },
      { label: 'Abuse', number: '1-800-799-7233' },
    ]),
  );
  assert.deepEqual(cache?.hotlines, [
    { label: 'Crisis line', number: '988' },
    { label: 'Abuse', number: '1-800-799-7233' },
  ]);
});

test('cache hotlines is [] when the field is missing or null', () => {
  assert.deepEqual(
    buildHybridSearchConfigCache('t1', null, directory())?.hotlines,
    [],
  );
  assert.deepEqual(
    buildHybridSearchConfigCache('t1', null, directory(null))?.hotlines,
    [],
  );
});

test('search tab has an unlocalized hotlines array with maxRows 4', () => {
  const find = (fields: any[]): any => {
    for (const f of fields) {
      if (f.name === 'hotlines') return f;
      if (f.fields) {
        const r = find(f.fields);
        if (r) return r;
      }
    }
  };
  const field = find((searchTab as any).fields);
  assert.ok(field, 'hotlines field exists');
  assert.equal(field.type, 'array');
  assert.equal(field.maxRows, 4);
  assert.ok(!field.localized);
  const sub = field.fields[0].fields;
  assert.ok(sub.every((f: any) => !f.localized));
});
