import { atom } from 'jotai';

import { FacetWithTranslation, Location, Taxonomy } from '@/types/resource';

export type ResultType = {
  _id: string;
  id: string;
  alert: string | null;
  alertDate: string | null;
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
  hours: string | null;
  currentListId?: string;
  onRemoveFromList?: (listId: string, favoriteId: string) => void;
};

// Search results themselves are request data, not client state: they live in
// `SearchResultsProvider` (features/search/context/search-results-context.tsx).
export const filtersOpenAtom = atom(false);
