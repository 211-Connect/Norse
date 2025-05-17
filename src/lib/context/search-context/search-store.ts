import { createStore } from 'zustand';

export type SearchState = {
  searchTerm: string;
};

export type SearchActions = {
  setSearchTerm: (newValue: string) => void;
};

export type SearchStore = SearchState & SearchActions;

const defaultInitialState: SearchState = {
  searchTerm: '',
};

export const createSearchStore = (
  initialState: SearchState = defaultInitialState,
) => {
  return createStore<SearchStore>()((set) => ({
    ...initialState,
    setSearchTerm: (newValue) =>
      set({
        searchTerm: newValue,
      }),
  }));
};
