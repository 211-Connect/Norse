import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getLocationConflict } from '../src/app/(app)/features/printable-directories/utils/getLocationConflict';
import { matchesDefaultLocation } from '../src/app/(app)/features/printable-directories/utils/matchesDefaultLocation';
import { withDefaultQueryParams } from '../src/app/(app)/features/printable-directories/utils/withDefaultQueryParams';
import { buildSearchUrl } from '../src/app/(app)/features/search/utils/buildSearchUrl';
import { parseSearchParams } from '../src/app/(app)/features/search/utils/parseSearchParams';

const YAKIMA = [-120.506076, 46.602248];

const params = (url: string) => new URL(url, 'http://x').searchParams;

describe('buildSearchUrl region (area search)', () => {
  test('an area carries region and no distance', () => {
    const url = params(
      buildSearchUrl({
        location: 'Yakima County, Washington, United States',
        coordinates: YAKIMA,
        region: 'county:53077',
        distance: '15',
        searchEngine: 'classic',
      }),
    );
    assert.equal(url.get('region'), 'county:53077');
    assert.equal(url.get('coords'), YAKIMA.join(','));
    assert.equal(url.get('distance'), null);
  });

  test('a point keeps its distance and has no region', () => {
    const url = params(
      buildSearchUrl({
        location: '1600 Summitview Ave, Yakima',
        coordinates: YAKIMA,
        region: '',
        distance: '15',
        searchEngine: 'classic',
      }),
    );
    assert.equal(url.get('region'), null);
    assert.equal(url.get('distance'), '15');
  });

  test('"Everywhere" drops the region with the location', () => {
    const url = params(
      buildSearchUrl({
        location: 'Everywhere',
        region: 'county:53077',
        searchEngine: 'classic',
      }),
    );
    assert.equal(url.get('region'), null);
  });
});

describe('parseSearchParams region', () => {
  test('reads region alongside its location', () => {
    assert.equal(
      parseSearchParams({ location: 'Yakima', region: 'county:53077' }).region,
      'county:53077',
    );
  });

  test('ignores a region without a location', () => {
    assert.equal(
      parseSearchParams({ region: 'county:53077' }).region,
      undefined,
    );
  });
});

describe('printable directory default Region', () => {
  const areaDefault = {
    locationName: 'Yakima County, WA',
    coords: { latitude: YAKIMA[1], longitude: YAKIMA[0] },
    radius: 15,
    regionId: 'county:53077',
  };

  test('fills region, not distance, into a source without a location', () => {
    const merged = withDefaultQueryParams({ query: 'food' }, areaDefault);
    assert.equal(merged.region, 'county:53077');
    assert.equal(merged.distance, undefined);
    assert.equal(merged.coords, YAKIMA.join(','));
  });

  test('leaves a source with its own coords alone', () => {
    const merged = withDefaultQueryParams(
      { coords: '-122.3,47.6', distance: 5 },
      areaDefault,
    );
    assert.equal(merged.region, undefined);
    assert.equal(merged.distance, 5);
  });

  test('the filled-in default matches; another Region does not', () => {
    const filled = withDefaultQueryParams({}, areaDefault);
    assert.equal(matchesDefaultLocation(areaDefault, filled), true);
    assert.equal(
      matchesDefaultLocation(areaDefault, {
        ...filled,
        region: 'county:53033',
      }),
      false,
    );
  });

  test('a different Region, or a point, conflicts with an area default', () => {
    assert.equal(
      getLocationConflict(areaDefault, { region: 'county:53077' }),
      false,
    );
    assert.equal(
      getLocationConflict(areaDefault, { region: 'county:53033' }),
      true,
    );
    assert.equal(getLocationConflict(areaDefault, { coords: '1,2' }), true);
    assert.equal(getLocationConflict(areaDefault, { query: 'food' }), false);
  });
});
