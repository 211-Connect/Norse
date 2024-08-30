import { createContext } from 'react';

export type Flags = {
  showResourceCategories: boolean;
  showResourceLastAssuredDate: boolean;
  showHomePageTour: boolean;
  showResourceAttribution: boolean;
  showSearchAndResourceServiceName: boolean;
  showSuggestionListTaxonomyBadge: boolean;
  requireUserLocation: boolean;
};

const flagsContext = createContext<Flags>(null);

export { flagsContext };
