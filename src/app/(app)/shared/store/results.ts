import { atom } from 'jotai';

import { FacetWithTranslation, Location, Taxonomy } from '@/types/resource';

export type ResultType = {
  _id: string;
  id: string;
  address: string;
  summary: string;
  description: string;
  location: Location | null;
  name: string;
  locationName: string | null;
  phone: string;
  attribution: string | null;
  priority: number;
  serviceName: string;
  website: string | null;
  taxonomies: Taxonomy[];
  facets: FacetWithTranslation[] | null | undefined;
  attributeValues: Record<string, string>;
  eligibility: string | null;
  applicationProcess: string | null;
  currentListId?: string;
  onRemoveFromList?: (listId: string, favoriteId: string) => void;
};

export const resultsAtom = atom<ResultType[] | null>(null);
export const resultTotalAtom = atom(0);
export const resultsCurrentPageAtom = atom<number>(0);

export const filtersOpenAtom = atom(false);
export const filtersAtom = atom({});
