import { atom } from 'jotai';

export const searchAtom = atom({
  query: '',
  queryLabel: '',
  queryType: '',
  searchTerm: '',
  searchLocation: '',
  searchCoordinates: [] as any[],
  prevSearchLocation: '',
  searchLocationValidationError: '',
  searchDistance: '',
  // New fields for advanced geospatial filtering
  searchPlaceType: [] as string[],
  searchBbox: null as [number, number, number, number] | null,
});

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

export const searchPlaceTypeAtom = atom(
  (get) => get(searchAtom).searchPlaceType,
);
export const searchBboxAtom = atom((get) => get(searchAtom).searchBbox);
