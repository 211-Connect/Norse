// The always-on emergency line: tenant hotlines, then 911 and 988, no duplicates (v2 only).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  DEFAULT_HOTLINES,
  EmergencyLine,
  emergencyLineHotlines,
} from '../src/app/(app)/features/search/components/emergency-line';
import { appConfigContext } from '../src/app/(app)/shared/context/app-config-context';
import { searchHotlinesFor } from '../src/utils/hotlines';

const numbers = (list: { number: string }[]) => list.map((h) => h.number);

test('emergencyLineHotlines: nothing given is 911 then 988', () => {
  assert.deepEqual(emergencyLineHotlines(), DEFAULT_HOTLINES);
  assert.deepEqual(emergencyLineHotlines(undefined, []), DEFAULT_HOTLINES);
  assert.deepEqual(numbers(DEFAULT_HOTLINES), ['911', '988']);
  assert.equal(DEFAULT_HOTLINES[0].label, 'Emergency: call 911');
});

test('emergencyLineHotlines: tenant rows first in their order, then 911 and 988', () => {
  const tenant = [
    { label: 'Abuse line', number: '1-800-799-7233' },
    { label: 'Local crisis', number: '555-0100' },
  ];
  assert.deepEqual(numbers(emergencyLineHotlines(tenant)), [
    '1-800-799-7233',
    '555-0100',
    '911',
    '988',
  ]);
});

test('emergencyLineHotlines: duplicate forms of 988 and 911 are dropped, the tenant label wins', () => {
  for (const form of ['988', '9-8-8', '(988)', ' 988 ']) {
    const out = emergencyLineHotlines([
      { label: 'Our crisis line', number: form },
    ]);
    assert.equal(out.length, 2, form);
    assert.equal(out[0].label, 'Our crisis line', form);
    assert.equal(out[0].number, form.trim(), form);
    assert.equal(out[1].number, '911', form);
  }
  const dup = emergencyLineHotlines([{ label: 'Police', number: '9 1 1' }]);
  assert.deepEqual(
    dup.map((h) => h.label),
    ['Police', 'Crisis line'],
  );
});

test('emergencyLineHotlines: 1-800 numbers that repeat are one chip, a different one stays', () => {
  const out = emergencyLineHotlines(
    [{ label: 'Abuse', number: '1-800-799-7233' }],
    [
      { label: 'Same, other form', number: '800.799.7233' },
      { label: 'Other', number: '1-800-273-8255' },
    ],
  );
  assert.deepEqual(
    out.map((h) => h.label),
    ['Abuse', 'Other', 'Emergency: call 911', 'Crisis line'],
  );
});

test('emergencyLineHotlines: API rows and tenant rows merge, tenant first', () => {
  const tenant = [{ label: 'Tenant', number: '555-0100' }];
  const api = [
    { label: 'API crisis', number: '988' },
    { label: 'API local', number: '555-0199' },
  ];
  assert.deepEqual(
    emergencyLineHotlines(tenant, api).map((h) => h.label),
    ['Tenant', 'API crisis', 'API local', 'Emergency: call 911'],
  );
});

test('emergencyLineHotlines: malformed and blank entries are dropped', () => {
  const bad = [
    null,
    undefined,
    {},
    { label: '', number: '555' },
    { label: 'No number', number: '  ' },
    { label: 5, number: '555' },
    { label: 'Digits only missing', number: 'call us' },
    { label: 'Good', number: ' 555-0100 ', extra: 1 },
  ] as never;
  const out = emergencyLineHotlines(bad);
  assert.deepEqual(numbers(out), ['555-0100', '911', '988']);
  assert.equal(emergencyLineHotlines('nope' as never).length, 2);
});

const withTenant = (
  hotlines: unknown,
  props: Record<string, unknown> = {},
  v2 = true,
) =>
  renderToStaticMarkup(
    createElement(
      appConfigContext.Provider,
      {
        value: {
          featureFlags: { enableV2Api: v2 },
          search: hotlines === undefined ? {} : { hotlines },
        } as never,
      },
      createElement(EmergencyLine, props),
    ),
  );

test('EmergencyLine render: unset, [] and no provider all give 911 and 988', () => {
  for (const html of [
    withTenant(undefined),
    withTenant([]),
    renderToStaticMarkup(createElement(EmergencyLine)),
  ]) {
    assert.match(html, /always-on-911-link/);
    assert.match(html, /always-on-988-link/);
  }
});

test('EmergencyLine render: tenant list first, 988 not shown twice', () => {
  const html = withTenant([
    { label: 'Local crisis', number: '555-0100' },
    { label: 'Lifeline', number: '9-8-8' },
  ]);
  assert.ok(html.indexOf('555-0100') < html.indexOf('tel:911'));
  assert.equal((html.match(/tel:/g) ?? []).length, 3);
  assert.match(html, /Lifeline/);
  assert.doesNotMatch(html, /always-on-988-link/);
  assert.match(html, /always-on-911-link/);
});

test('EmergencyLine render: a failed v2 call (no API rows) still shows tenant, 911 and 988', () => {
  const html = withTenant([{ label: 'Tenant line', number: '555-0100' }], {
    hotlines: undefined,
  });
  assert.match(html, /Tenant line/);
  assert.match(html, /tel:911/);
  assert.match(html, /tel:988/);
});

test('EmergencyLine render: the API rows of the results page join the tenant rows', () => {
  const html = withTenant([{ label: 'Tenant', number: '555-0100' }], {
    hotlines: [{ label: 'API row', number: '555-0199' }],
  });
  assert.ok(html.indexOf('Tenant') < html.indexOf('API row'));
  assert.ok(html.indexOf('API row') < html.indexOf('tel:911'));
});

test('searchHotlinesFor: only a v2 tenant gets the list; v1 config stays unchanged', () => {
  const rows = [
    { label: ' Crisis ', number: ' 555-0100 ' },
    { label: '', number: '1' },
  ] as never;
  assert.deepEqual(searchHotlinesFor(true, rows), [
    { label: 'Crisis', number: '555-0100' },
  ]);
  assert.deepEqual(searchHotlinesFor(true, undefined), []);
  assert.equal(searchHotlinesFor(false, rows), undefined);
  assert.equal(searchHotlinesFor(undefined, rows), undefined);
  // v1 config bytes: the key is not even present.
  const v1 = JSON.stringify({ a: 1, hotlines: searchHotlinesFor(false, rows) });
  assert.equal(v1, '{"a":1}');
});

test('buildAppConfig sets search.hotlines through searchHotlinesFor with the v2 flag', () => {
  const src = readFileSync(
    'src/app/(app)/shared/utils/buildAppConfig.ts',
    'utf8',
  );
  assert.match(
    src,
    /hotlines: searchHotlinesFor\(\s*resourceDirectory\.featureFlags\?\.enableV2Api,\s*resourceDirectory\.search\.searchSettings\.hotlines,?\s*\)/,
  );
});
