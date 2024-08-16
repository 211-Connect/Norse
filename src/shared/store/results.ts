import { atom } from 'jotai';

export type ResultType = {
  _id: string;
  id: string;
  address: string;
  description: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  name: string;
  phone: string;
  priority: number;
  serviceName: string;
  website: string;
  taxonomyTerms: string[];
  taxonomyCodes: string[];
};

export const resultsAtom = atom<ResultType[]>([]);

export const resultTotalAtom = atom(0);

export const resultsCurrentPageAtom = atom(0);

export const filtersOpenAtom = atom(false);
export const filtersAtom = atom({});
