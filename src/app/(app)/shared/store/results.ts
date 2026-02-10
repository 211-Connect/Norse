import { atom } from 'jotai';
import { Location, Taxonomy, FacetWithTranslation } from '@/types/resource';

export type ResultType = {
  _id: string;
  id: string;
  address: string;
  summary: string;
  description: string;
  location: Location | null;
  name: string;
  phone: string;
  priority: number;
  serviceName: string;
  website: string;
  taxonomies: Taxonomy[];
  facets?: FacetWithTranslation[] | null;
};

export const resultsAtom = atom<ResultType[]>([]);

export const resultTotalAtom = atom(0);

export const noResultsAtom = atom(false);

export const resultsCurrentPageAtom = atom(0);

export const filtersOpenAtom = atom(false);
export const filtersAtom = atom({});
