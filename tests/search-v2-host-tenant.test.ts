import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { resolveV2HostTenant } from '../src/app/(app)/features/search/v2/v2-host-tenant';
import { buildV2Url } from '../src/app/(app)/features/search/v2/v2-request';

// The seam (adversarial-review finding 1, PR #1222):
//   browser side: `use-v2-search.ts` sends `?tenant_id=<tenant>&...` to `/api/v2-search`.
//   server side:  `api/v2-search/route.ts` takes the tenant from the host (`resolveV2HostTenant`),
//                 as v1 `api/search-pins/route.ts` does, and sends it in the Norse-API URL.
const HOST_TENANT = 'T-HOST';
const OTHER_TENANT = 'T-OTHER';

const config = (flag: boolean, locales = ['en', 'es']) => ({
  tenantId: HOST_TENANT,
  featureFlags: { enableV2Api: flag },
  i18n: { locales },
});
const deps = (flag = true, locales?: string[]) => ({
  getConfig: async () => config(flag, locales),
  isValidLocale: (l: unknown) =>
    typeof l === 'string' && /^[a-z]{2,3}$/.test(l),
});

test('host tenant with enableV2Api on: ok, tenant from the host config', async () => {
  const r = await resolveV2HostTenant('es', deps());
  assert.deepEqual(r, { ok: true, tenantId: HOST_TENANT, locale: 'es' });
});

test('no locale: English, as buildV2Url defaults', async () => {
  const r = await resolveV2HostTenant(null, deps());
  assert.deepEqual(r, { ok: true, tenantId: HOST_TENANT, locale: 'en' });
});

test('enableV2Api off on the host tenant: 404', async () => {
  const r = await resolveV2HostTenant('en', deps(false));
  assert.deepEqual(r, { ok: false, status: 404, error: 'Not found' });
});

test('locale that is not a locale code: 400, config is not read', async () => {
  let read = false;
  const r = await resolveV2HostTenant('../x', {
    isValidLocale: deps().isValidLocale,
    getConfig: async () => {
      read = true;
      return config(true);
    },
  });
  assert.deepEqual(r, { ok: false, status: 400, error: 'Invalid locale' });
  assert.equal(read, false);
});

test('locale the host tenant does not offer: 404', async () => {
  const r = await resolveV2HostTenant('fr', deps(true, ['en']));
  assert.deepEqual(r, { ok: false, status: 404, error: 'Not found' });
});

test("failure state: another tenant's tenant_id in the browser query never reaches Norse-API", async () => {
  const browserQuery = new URLSearchParams(
    `tenant_id=${OTHER_TENANT}&query=food&locale=es`,
  );
  const host = await resolveV2HostTenant(browserQuery.get('locale'), deps());
  assert.ok(host.ok);
  const url = new URL(buildV2Url('http://api', browserQuery, host.tenantId));
  assert.equal(url.searchParams.get('tenant_id'), HOST_TENANT);
  assert.equal(url.searchParams.getAll('tenant_id').length, 1);
  // Decision 34 (Norse-API #321 CDN cache key): tenant_id and locale stay in the URL.
  assert.equal(url.searchParams.get('locale'), 'es');
  assert.ok(!url.toString().includes(OTHER_TENANT));
});

test('both v2 routes take the tenant from the host and never read tenant_id from the query', () => {
  for (const file of [
    'src/app/(app)/api/v2-search/route.ts',
    'src/app/(app)/api/v2-search/pins/route.ts',
  ]) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /resolveV2HostTenant\(/, file);
    assert.doesNotMatch(src, /get\(['"]tenant_id['"]\)/, file);
    assert.match(src, /host\.tenantId/, file);
  }
});
