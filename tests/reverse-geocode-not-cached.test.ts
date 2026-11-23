import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

/**
 * The real `withCache` runs here, with a fake Redis (`cacheService`) and a
 * geocoder that fails once and then works. `reverseGeocode` turns a failure
 * into `[]`; that `[]` must never be written to the cache, or one provider
 * outage would blank the place name for 7 days.
 */
type Fake = {
  store: Map<string, string>;
  sets: string[];
  calls: number;
  failNext: boolean;
};
const fake: Fake = {
  store: new Map(),
  sets: [],
  calls: 0,
  failNext: true,
};
(globalThis as typeof globalThis & { reverseGeocodeFake?: Fake }).reverseGeocodeFake =
  fake;

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubs: Record<string, string> = {
      '@/cacheService': `const f = globalThis.reverseGeocodeFake;
        export const cacheService = {
          get: async (k) => f.store.get(k) ?? null,
          set: async (k, v) => { f.sets.push(k); f.store.set(k, v); },
          del: async (k) => { f.store.delete(k); },
        };`,
      '@/lib/api': `const f = globalThis.reverseGeocodeFake;
        export const geocodingApiClient = { request: async () => {
          f.calls += 1;
          if (f.failNext) throw new Error("geocoder down");
          return { data: [{ type: "coordinates", place: "Seattle" }] };
        } };
        export const getApiHeaders = async () => ({});`,
      '@/lib/logger':
        'export const createLogger = () => ({ error() {}, warn() {}, info() {}, debug() {} });',
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

test('a failed reverse geocode is not cached; the next call asks the geocoder again', async () => {
  const { reverseGeocode } =
    await import('../src/app/(app)/shared/serverActions/geocoding/reverseGeocode');
  const options = { locale: 'en', tenantId: 'tenant-1' };

  const failed = await reverseGeocode('-122.3,47.6', options);
  assert.deepEqual(failed, []);
  assert.equal(fake.sets.length, 0, 'a failure must not write the cache');
  assert.equal(fake.store.size, 0);

  fake.failNext = false;
  const recovered = await reverseGeocode('-122.3,47.6', options);
  assert.equal(fake.calls, 2, 'the second call reached the geocoder');
  assert.equal(recovered[0]?.place, 'Seattle');
  assert.equal(fake.sets.length, 1, 'only the good result is cached');
});
