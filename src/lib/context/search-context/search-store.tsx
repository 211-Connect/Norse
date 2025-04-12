import { createStore } from 'zustand';

export type SearchState = {};

export type SearchStore = SearchState;

const defaultInitialState: SearchState = {};

export const createSearchStore = (
  initialState: SearchState = defaultInitialState,
) => {
  return createStore<SearchStore>()(() => initialState);
};
