import { atom } from 'jotai';

export const searchAtom = atom({
  query: '',
  queryLabel: '',
  queryType: '',
  searchTerm: '',
  searchLocation: '',
  searchLocationValidationError: '',
  searchDistance: '',
  userLocation: '',
  userCoordinates: [],
});

// Currently searched term (This is the visible value in the input)
export const searchTermAtom = atom((get) => get(searchAtom).searchTerm);

// The below values are used specifically for the query parameters and are separate from the search term
export const queryAtom = atom((get) => get(searchAtom).query);
export const queryLabelAtom = atom((get) => get(searchAtom).queryLabel);
export const queryTypeAtom = atom((get) => get(searchAtom).queryType);

// Currently searched location
export const searchLocationAtom = atom((get) => get(searchAtom).searchLocation);
export const searchLocationValidationErrorAtom = atom(
  (get) => get(searchAtom).searchLocationValidationError,
);

// Currently selected user location
export const userLocationAtom = atom((get) => get(searchAtom).userLocation);

export const searchDistanceAtom = atom((get) => get(searchAtom).searchDistance);

// Currently selected user coordinates
export const userCoordinatesAtom = atom(
  (get) => get(searchAtom).userCoordinates,
);
