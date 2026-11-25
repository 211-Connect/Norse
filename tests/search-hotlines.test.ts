// Per-tenant emergency hotlines for v2 search (ISS-2499, ADR 0039).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  isValidHotlineNumber,
  validateHotlineLabel,
} from '../src/payload/collections/ResourceDirectories/fields/hotlineNumber';
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

// Both sides of the seam (Norse-API `src/v2/rules/questions.ts`: `tenant.hotlines?.length ? tenant.hotlines : DEFAULT_HOTLINES`).
test('all rows blank gives [] so Norse-API falls back to 988 and 911', () => {
  assert.deepEqual(
    buildHybridSearchConfigCache(
      't1',
      null,
      directory([
        { label: '', number: '988' },
        { label: 'Emergency', number: '   ' },
      ]),
    )?.hotlines,
    [],
  );
});

test('the hotlines migration is registered after the v2 flag migration', () => {
  const index = readFileSync(
    'src/payload/migrations/postgres/index.ts',
    'utf8',
  );
  const names = [...index.matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
  assert.equal(names.at(-1), '20261123_120000_v2_search_hotlines');
  assert.ok(names.indexOf('20261119_180448_v2_search_flag') < names.length - 1);
});

test('the hotlines migration has a schema snapshot with both array tables', () => {
  const dir = 'src/payload/migrations/postgres/';
  const snap = JSON.parse(
    readFileSync(`${dir}20261123_120000_v2_search_hotlines.json`, 'utf8'),
  );
  const prev = JSON.parse(
    readFileSync(`${dir}20261119_180448_v2_search_flag.json`, 'utf8'),
  );
  assert.notEqual(snap.id, prev.id);
  for (const [table, parent] of [
    ['rds_search_search_settings_hotlines', 'rds'],
    ['_rds_v_version_search_search_settings_hotlines', '_rds_v'],
  ]) {
    const t = snap.tables[`public.${table}`];
    assert.ok(t, table);
    assert.deepEqual(
      ['label', 'number'].map((c) => [
        t.columns[c]?.type,
        t.columns[c]?.notNull,
      ]),
      [
        ['varchar', true],
        ['varchar', true],
      ],
    );
    assert.equal(t.foreignKeys[`${table}_parent_id_fk`].tableTo, parent);
  }
  // Only the two new tables were added to the previous snapshot.
  const added = Object.keys(snap.tables).filter((k) => !(k in prev.tables));
  assert.equal(added.length, 2);
});

test('a blank hotline label is rejected in the admin, not dropped silently', () => {
  for (const blank of ['', '   ', undefined, null]) {
    assert.notEqual(
      (validateHotlineLabel as any)(blank, {}),
      true,
      String(blank),
    );
  }
  assert.equal((validateHotlineLabel as any)('Crisis line', {}), true);
});
