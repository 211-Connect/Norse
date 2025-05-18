import { createStore } from 'zustand';

export type LocationState = {
  searchTerm: string;
  selectedValue: string;
  userCoords: [number, number] | undefined;
};

export type LocationActions = {
  setSearchTerm: (newValue: string) => void;
  setSelectedValue: (newValue: string) => void;
  setUserCoords: (newValue: [number, number]) => void;
};

export type LocationStore = LocationState & LocationActions;

const defaultInitialState: LocationState = {
  searchTerm: '',
  selectedValue: '',
  userCoords: undefined,
};

export const createLocationStore = (
  initialState: LocationState = defaultInitialState,
) => {
  return createStore<LocationStore>()((set) => ({
    ...initialState,
    setSearchTerm: (newValue) =>
      set({
        searchTerm: newValue,
      }),
    setSelectedValue: (newValue) => set({ selectedValue: newValue }),
    setUserCoords: (newValue) =>
      set({
        userCoords: newValue,
      }),
  }));
};
