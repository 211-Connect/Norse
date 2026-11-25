import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// The server action rejects, as it does when the geocoder is down.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('/geocoding/reverseGeocode')) {
      return {
        url: `data:text/javascript,${encodeURIComponent(
          'export const reverseGeocode = async () => { throw new Error("geocoder down"); };',
        )}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

const load = () => import('../src/app/(app)/shared/lib/search-location-meta');

test('a geocoder failure keeps the analytics payload, with an empty location', async () => {
  const { buildSearchLocationPayload } = await load();
  const payload = await buildSearchLocationPayload(
    [-87.6, 41.8],
    [-87.7, 41.9],
    'tenant-1',
    'county:17031',
  );

  assert.deepEqual(payload, {
    searchCoordinates: '-87.6,41.8',
    userCoordinates: '-87.7,41.9',
    searchCity: '',
    searchZipCode: '',
    searchCounty: '',
    userCity: '',
    userZipCode: '',
    userCounty: '',
    searchMode: 'area',
    searchRegionId: 'county:17031',
    searchRegionType: 'county',
  });
});

test('a geocoder failure keeps the metadata of the selected location', async () => {
  const { getSearchLocationMeta } = await load();
  const meta = await getSearchLocationMeta([-87.6, 41.8], 'tenant-1', {
    coordinates: [-87.6, 41.8],
    place: 'Chicago',
  } as never);

  assert.deepEqual(meta, { city: 'Chicago', zipCode: '', county: '' });
});
