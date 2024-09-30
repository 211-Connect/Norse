import { createContext } from 'react';

export type Flags = {
  showResourceCategories: boolean;
  showResourceLastAssuredDate: boolean;
  showHomePageTour: boolean;
  showResourceAttribution: boolean;
  showSearchAndResourceServiceName: boolean;
  showSuggestionListTaxonomyBadge: boolean;
  showUseMyLocationButtonOnDesktop: boolean;
  requireUserLocation: boolean;
};

const defaultContext: Flags = {
  showResourceCategories: true,
  showResourceLastAssuredDate: true,
  showHomePageTour: true,
  showResourceAttribution: true,
  showSearchAndResourceServiceName: true,
  showSuggestionListTaxonomyBadge: true,
  showUseMyLocationButtonOnDesktop: true,
  requireUserLocation: false,
};

const flagsContext = createContext<Flags>(defaultContext);

export { flagsContext };
