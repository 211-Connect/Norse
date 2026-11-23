import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const globals = globalThis as typeof globalThis & {
  reverseGeocodeLogged?: unknown[];
};
globals.reverseGeocodeLogged = [];

// withCache runs the loader, so a thrown geocoder request reaches reverseGeocode.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubs: Record<string, string> = {
      '@/lib/api':
        'export const geocodingApiClient = { request: async () => { throw new Error("geocoder down"); } }; export const getApiHeaders = async () => ({});',
      '@/lib/logger':
        'export const createLogger = () => ({ error: (...args) => globalThis.reverseGeocodeLogged.push(args) });',
      '@/utilities/withCache':
        'export const ONE_DAY = 86400; export const stableHash = () => "h"; export const withCache = (_key, loader) => loader();',
    };
    if (specifier in stubs) {
      return {
        url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

test('reverseGeocode returns no results and logs when the geocoder throws', async () => {
  const { reverseGeocode } =
    await import('../src/app/(app)/shared/serverActions/geocoding/reverseGeocode');

  const results = await reverseGeocode('-87.6,41.8', {
    locale: 'en',
    tenantId: 'tenant-1',
  });

  assert.deepEqual(results, []);
  assert.equal(globals.reverseGeocodeLogged?.length, 1);
});

test('search location meta falls back to empty meta when the geocoder throws', async () => {
  const { getSearchLocationMeta } =
    await import('../src/app/(app)/shared/lib/search-location-meta');
  const meta = await getSearchLocationMeta([-87.6, 41.8], 'tenant-1');
  assert.deepEqual(meta, { city: '', zipCode: '', county: '' });
});
