import { Tab } from 'payload';
import {
  hasFeatureFieldAccess,
  hasLayoutFieldAccess,
  hasResourceNavigationFieldAccess,
  hasSearchFieldAccess,
} from '../../Users/access/permissions';

export const featureFlags: Tab = {
  name: 'featureFlags',
  fields: [
    {
      name: 'hideCategoriesHeading',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      name: 'hideDataProvidersHeading',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'showResourceAttribution',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'showResourceCategories',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'showResourceLastAssuredDate',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'showHomePageTour',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
    {
      name: 'requireUserLocation',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasSearchFieldAccess,
        update: hasSearchFieldAccess,
      },
    },
    {
      name: 'showSearchAndResourceServiceName',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'showSuggestionListTaxonomyBadge',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      name: 'showUseMyLocationButtonOnDesktop',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
    {
      name: 'showPrintButton',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
    {
      name: 'turnResourceCardTaxonomiesIntoLinks',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
    {
      name: 'useHybridSemanticSearch',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
    {
      name: 'showFeedbackButtonGlobal',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
    {
      name: 'showFeedbackButtonOnResourcePages',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
  ],
};
