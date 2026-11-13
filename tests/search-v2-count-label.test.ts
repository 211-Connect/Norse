// Prototype: the option count "12 services offer this" must resolve on the search page.
// The page's default namespace is `page-search`; the key lives in `common`. A bare
// `useTranslation()` then printed the raw key `search.v2_option_services_count`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { createInstance } from 'i18next';

import common from '../public/locales/en/common.json';

const SEARCH_PAGE_NAMESPACES = ['page-search', 'page-resource', 'page-list', 'common'];

async function searchPageI18n() {
  const i18n = createInstance();
  await i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: SEARCH_PAGE_NAMESPACES[0],
    fallbackNS: SEARCH_PAGE_NAMESPACES[0],
    ns: SEARCH_PAGE_NAMESPACES,
    resources: { en: { 'page-search': {}, common } },
  });
  return i18n;
}

test('the count key resolves from the common namespace, one and many', async () => {
  const t = (await searchPageI18n()).getFixedT('en', 'common');
  assert.equal(t('search.v2_option_services_count', { count: 12 }), '12 services offer this');
  assert.equal(t('search.v2_option_services_count', { count: 1 }), '1 service offers this');
});

test('without the namespace the key stays raw (why the call must name it)', async () => {
  const t = (await searchPageI18n()).t;
  assert.equal(t('search.v2_option_services_count', { count: 12 }), 'search.v2_option_services_count');
});

for (const file of [
  'src/app/(app)/features/search/components/search-follow-up.tsx',
  'src/app/(app)/shared/components/search/search-guide.tsx',
]) {
  test(`${file} reads the count from the common namespace`, () => {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /useTranslation\('common'\)/);
    assert.doesNotMatch(source, /useTranslation\(\)/);
  });
}
