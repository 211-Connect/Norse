import { atom } from 'jotai';

export const searchAtom = atom({
  searchTerm: '',
  searchLocation: '',
  userLocation: '',
  userCoordinates: [0, 0],
});

// Currently searched term
export const searchTermAtom = atom((get) => get(searchAtom).searchTerm);

// Currently searched location
export const searchLocationAtom = atom((get) => get(searchAtom).searchLocation);

// Currently selected user location
export const userLocationAtom = atom((get) => get(searchAtom).userLocation);

// Currently selected user coordinates
export const userCoordinatesAtom = atom(
  (get) => get(searchAtom).userCoordinates,
);
