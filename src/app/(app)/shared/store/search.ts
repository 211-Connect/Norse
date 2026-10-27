import { atom } from 'jotai';

import { ResourceEntry } from '@/app/(app)/shared/lib/analytics';

export type SearchState = typeof DEFAULT_SEARCH_STATE;

export const DEFAULT_SEARCH_STATE = {
  query: '',
  queryLabel: '',
  queryType: '',
  // Scope results to a single organization by its stable id (set when the user
  // picks an organization from the typeahead). Sent to /search as
  // organization_id; composes with query/query_type rather than replacing them.
  organizationId: '',
  href: '',
  target: '' as '' | '_self' | '_blank',
  searchTerm: '',
  searchLocation: '',
  searchCoordinates: [] as any[],
  prevSearchLocation: '',
  searchLocationValidationError: '',
  searchDistance: '',
  // Region id(s) the picked location is an area of (e.g. `county:53077`),
  // empty for a point. Sent to /search as `region`; see docs/area-search.md.
  searchRegion: '',
};

export const searchAtom = atom<SearchState>(DEFAULT_SEARCH_STATE);

export const userCoordinatesAtom = atom([] as number[]);

// Currently searched term (This is the visible value in the input)
export const searchTermAtom = atom((get) => get(searchAtom).searchTerm);

// The below values are used specifically for the query parameters and are separate from the search term
export const queryAtom = atom((get) => get(searchAtom).query);
export const queryLabelAtom = atom((get) => get(searchAtom).queryLabel);
export const queryTypeAtom = atom((get) => get(searchAtom).queryType);

// Currently searched location
export const searchLocationAtom = atom((get) => get(searchAtom).searchLocation);
export const prevSearchLocationAtom = atom(
  (get) => get(searchAtom).prevSearchLocation,
);
export const searchLocationValidationErrorAtom = atom(
  (get) => get(searchAtom).searchLocationValidationError,
);
export const searchCoordinatesAtom = atom(
  (get) => get(searchAtom).searchCoordinates,
);

export const searchDistanceAtom = atom((get) => get(searchAtom).searchDistance);

export const searchRegionAtom = atom((get) => get(searchAtom).searchRegion);

export const searchEntryAtom = atom<ResourceEntry>(ResourceEntry.SearchCard);
