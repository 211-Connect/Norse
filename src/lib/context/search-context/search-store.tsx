import { createStore } from 'zustand';

export type SearchState = {
  query: string;
  queryLabel: string;
  queryType: string;
  searchTerm: string;
  prevSearchTerm: string;
  searchLocation: string;
  searchCoordinates: number[];
  prevSearchLocation: string;
  searchLocationValidationError: string;
  searchDistance: string;
  userCoordinates: number[];
};

export type SearchStore = SearchState;

const defaultInitialState: SearchState = {
  query: '',
  queryLabel: '',
  queryType: '',
  searchTerm: '',
  prevSearchTerm: '',
  searchLocation: '',
  searchCoordinates: [],
  prevSearchLocation: '',
  searchLocationValidationError: '',
  searchDistance: '',
  userCoordinates: [],
};

export const createSearchStore = (
  initialState: SearchState = defaultInitialState,
) => {
  return createStore<SearchStore>()(() => initialState);
};
