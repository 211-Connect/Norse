import { createStore } from 'zustand';

export type LocationState = {
  searchTerm: string;
  selectedValue: string;
};

export type LocationActions = {
  setSearchTerm: (newValue: string) => void;
  setSelectedValue: (newValue: string) => void;
};

export type LocationStore = LocationState & LocationActions;

const defaultInitialState: LocationState = {
  searchTerm: '',
  selectedValue: '',
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
  }));
};
