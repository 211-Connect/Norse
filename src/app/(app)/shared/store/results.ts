import { atom } from 'jotai';
import { Location, Taxonomy } from '@/types/resource';

export type ResultType = {
  _id: string;
  id: string;
  address: string;
  summary: string;
  description: string;
  location: Location;
  name: string;
  phone: string;
  priority: number;
  serviceName: string;
  website: string;
  taxonomies: Taxonomy[];
};

export const resultsAtom = atom<ResultType[]>([]);

export const resultTotalAtom = atom(0);

export const noResultsAtom = atom(false);

export const resultsCurrentPageAtom = atom(0);

export const filtersOpenAtom = atom(false);
export const filtersAtom = atom({});
