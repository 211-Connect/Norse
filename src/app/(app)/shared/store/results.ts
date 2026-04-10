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
  attribution: string | null;
  priority: number;
  serviceName: string;
  website: string;
  taxonomies: Taxonomy[];
  facets: FacetWithTranslation[] | null | undefined;
  attributeValues: Record<string, string>;
};

export const resultsAtom = atom<ResultType[]>([]);
export const resultTotalAtom = atom(0);
export const resultsCurrentPageAtom = atom<number>(0);

export const filtersOpenAtom = atom(false);
export const filtersAtom = atom({});
