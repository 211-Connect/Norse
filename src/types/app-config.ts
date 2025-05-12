type MenuItem = {
  name: string;
  href: string;
  target?: '_blank' | '_self';
};

type Image = {
  url: string;
  width: number;
  height: number;
};

export interface AppConfig {
  brandName: string;
  feedbackUrl: string;
  email?: string;
  phoneNumber?: string;
  logo?: Image;
  favicon?: Image;
  hero?: Image;
  openGraph?: Image;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    borderRadius: string;
  };
  alert?: {};
  homePage?: {
    title: string;
    description: string;
  };
  resourcePage?: {};
  search?: {
    homePageTitle?: string;
    queryInputPlaceholder?: string;
    locationInputPlaceholder?: string;
    noResultsFallbackText?: string;
    resultsLimit?: number;
  };
  featureFlags?: {
    showResourceCategories: boolean;
    showResourceLastAssuredDate: boolean;
    showHomePageTour: boolean;
    showResourceAttribution: boolean;
    requireUserLocation: boolean;
    showSearchAndResourceServiceName: boolean;
    showSuggestionListTaxonomyBadge: boolean;
    showUseMyLocationButtonOnDesktop: boolean;
    showTaxonomyBadge: boolean;
  };
  radiusSelectValues: {
    value: number;
  }[];
  dataproviders: {}[];
  headerMenu: MenuItem[];
  footerMenu: MenuItem[];
}
