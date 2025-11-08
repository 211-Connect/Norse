import { Tab } from 'payload';

export const featureFlags: Tab = {
  name: 'featureFlags',
  fields: [
    {
      name: 'hideCategoriesHeading',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'hideDataProvidersHeading',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showResourceCategories',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showHomePageTour',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'requireUserLocation',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showResourceLastAssuredDate',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showSearchAndResourceServiceName',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showSuggestionListTaxonomyBadge',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showUseMyLocationButtonOnDesktop',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showPrintButton',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
};
