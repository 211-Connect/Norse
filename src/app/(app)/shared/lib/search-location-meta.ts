'use client';

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
};

export async function buildSearchLocationPayload(
  searchCoordinates: number[],
  userCoordinates: number[],
  tenantId: string,
): Promise<SearchLocationPayload> {
  const [searchMeta, userMeta] = await Promise.all([
    getSearchLocationMeta(searchCoordinates, tenantId),
    getLocationMeta(userCoordinates, tenantId),
  ]);

  return {
    searchCoordinates: searchCoordinates.join(',') ?? '',
    userCoordinates: userCoordinates.join(',') ?? '',
    searchCity: searchMeta.city,
    searchZipCode: searchMeta.zipCode,
    searchCounty: searchMeta.county,
    userCity: userMeta.city,
    userZipCode: userMeta.zipCode,
    userCounty: userMeta.county,
  };
}
