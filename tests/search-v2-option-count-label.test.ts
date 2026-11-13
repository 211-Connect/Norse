// Prototype: the option count says what it counts (Lucas, 2026-11-12, answer 8; ADR 0039 Decision 46).
// A count is "all services for this search that carry that need". It ignores the needs already picked.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import i18next from 'i18next';

const en = JSON.parse(readFileSync('public/locales/en/common.json', 'utf8'));
const KEY = 'search.v2_option_services_count';

async function translator() {
  const i18n = i18next.createInstance();
  await i18n.init({
    lng: 'en',
    resources: { en: { common: en } },
    defaultNS: 'common',
    keySeparator: '.',
  });
  return i18n.t.bind(i18n);
}

test('option count label: names services and the need, in plain words, singular and plural', async () => {
  const t = await translator();
  assert.equal(t(KEY, { count: 1 }), '1 service offers this');
  assert.equal(t(KEY, { count: 12 }), '12 services offer this');
});

test('option count label: the wording does not say "results" (a pick does not shrink the list)', async () => {
  const t = await translator();
  assert.doesNotMatch(t(KEY, { count: 12 }), /result/i);
});

test('both cards draw the option count through the i18n key, not a hard-coded word', () => {
  for (const file of [
    'src/app/(app)/features/search/components/search-follow-up.tsx',
    'src/app/(app)/shared/components/search/search-guide.tsx',
  ]) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /v2_option_services_count/, file);
    assert.doesNotMatch(source, /resultCount\(option\.keeps\)/, file);
  }
});
