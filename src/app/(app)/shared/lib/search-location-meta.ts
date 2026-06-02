'use client';

import { reverseGeocode } from '../serverActions/geocoding/reverseGeocode';

export interface SearchLocationMeta {
  searchZipCode: string;
  searchCounty: string;
}

const EMPTY_META: SearchLocationMeta = {
  searchZipCode: '',
  searchCounty: '',
};

export async function getSearchLocationMeta(
  searchCoordinates: number[],
  tenantId?: string,
): Promise<SearchLocationMeta> {
  if (searchCoordinates.length !== 2) {
    return EMPTY_META;
  }

  const results = await reverseGeocode(searchCoordinates.join(','), {
    locale: 'en',
    tenantId,
    provider: 'opencage',
  });

  const hit = results.find((result) => result.type === 'coordinates');
  return {
    searchZipCode: hit?.postcode ?? '',
    searchCounty: hit?.district ?? '',
  };
}

type SearchLocationPayload = {
  userCoordinates: string;
  searchCoordinates: string;
  searchZipCode: string;
  searchCounty: string;
};

export async function buildSearchLocationPayload(
  searchCoordinates: number[],
  userCoordinates: number[],
  tenantId?: string,
): Promise<SearchLocationPayload> {
  const { searchZipCode, searchCounty } = await getSearchLocationMeta(
    searchCoordinates,
    tenantId,
  );

  return {
    userCoordinates: userCoordinates.join(',') ?? '',
    searchCoordinates: searchCoordinates.join(',') ?? '',
    searchZipCode,
    searchCounty,
  };
}
