'use client';

import { isRegionId } from '@/types/areaSearch';

import { reverseGeocode } from '../serverActions/geocoding/reverseGeocode';

interface LocationMeta {
  city: string;
  zipCode: string;
  county: string;
}

const EMPTY_LOCATION_META: LocationMeta = {
  city: '',
  zipCode: '',
  county: '',
};

async function getLocationMeta(
  coordinates: number[],
  tenantId: string,
): Promise<LocationMeta> {
  if (coordinates.length !== 2) return EMPTY_LOCATION_META;

  const results = await reverseGeocode(coordinates.join(','), {
    locale: 'en',
    tenantId,
    provider: 'opencage',
  });
  const hit = results.find((result) => result.type === 'coordinates');

  return {
    city: hit?.place ?? '',
    zipCode: hit?.postcode ?? '',
    county: hit?.district ?? '',
  };
}

export function getSearchLocationMeta(
  searchCoordinates: number[],
  tenantId: string,
): Promise<LocationMeta> {
  return getLocationMeta(searchCoordinates, tenantId);
}

export type SearchLocationPayload = {
  userCoordinates: string;
  searchCoordinates: string;
  searchCity: string;
  searchZipCode: string;
  searchCounty: string;
  userCity: string;
  userZipCode: string;
  userCounty: string;
  /** `area` with a region, `radius` with coordinates only, else empty. */
  searchMode: '' | 'area' | 'radius';
  /** Region id of an area search, e.g. `county:53033`; empty otherwise. */
  searchRegionId: string;
  /** `state`, `county`, `place` or `zip`; empty when not an area search. */
  searchRegionType: string;
};

/**
 * An area search's coordinates are a point inside the area (the geocoder's
 * centre), so the city, ZIP and county reverse-geocoded from it describe that
 * one point, not the area. Keep only the levels the area itself pins down:
 * a state search has no city, ZIP or county; a county search no city or ZIP;
 * a place (city) search no ZIP. A ZIP search takes its ZIP from the id.
 */
function scopeMetaToRegion(
  meta: LocationMeta,
  regionType: string,
  regionCode: string,
): LocationMeta {
  switch (regionType) {
    case 'state':
      return EMPTY_LOCATION_META;
    case 'county':
      return { ...EMPTY_LOCATION_META, county: meta.county };
    case 'place':
      return { ...meta, zipCode: '' };
    case 'zip':
      return { ...meta, zipCode: regionCode };
    default:
      return meta;
  }
}

export async function buildSearchLocationPayload(
  searchCoordinates: number[],
  userCoordinates: number[],
  tenantId: string,
  searchRegion?: string | null,
): Promise<SearchLocationPayload> {
  const regionId = isRegionId(searchRegion) ? searchRegion : '';
  const [regionType = '', regionCode = ''] = regionId
    ? regionId.split(':')
    : [];

  const [rawSearchMeta, userMeta] = await Promise.all([
    regionType === 'state'
      ? EMPTY_LOCATION_META
      : getSearchLocationMeta(searchCoordinates, tenantId),
    getLocationMeta(userCoordinates, tenantId),
  ]);
  const searchMeta = regionId
    ? scopeMetaToRegion(rawSearchMeta, regionType, regionCode)
    : rawSearchMeta;

  return {
    searchCoordinates: searchCoordinates.join(',') ?? '',
    userCoordinates: userCoordinates.join(',') ?? '',
    searchCity: searchMeta.city,
    searchZipCode: searchMeta.zipCode,
    searchCounty: searchMeta.county,
    userCity: userMeta.city,
    userZipCode: userMeta.zipCode,
    userCounty: userMeta.county,
    searchMode: regionId
      ? 'area'
      : searchCoordinates.length === 2
        ? 'radius'
        : '',
    searchRegionId: regionId,
    searchRegionType: regionType,
  };
}
