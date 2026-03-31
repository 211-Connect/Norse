import { Tab } from 'payload';
import {
  superAdminFieldAccess,
  superAdminOrSupportFieldAccess,
  superAdminOrSupportOrTenantFieldAccess,
} from '../../Users/access/roles';

export const featureFlags: Tab = {
  name: 'featureFlags',
  fields: [
    {
      name: 'hideCategoriesHeading',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
    },
    {
      name: 'hideDataProvidersHeading',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'showResourceAttribution',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'showResourceCategories',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'showResourceLastAssuredDate',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'showHomePageTour',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportFieldAccess,
        update: superAdminOrSupportFieldAccess,
      },
    },
    {
      name: 'requireUserLocation',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
    },
    {
      name: 'showSearchAndResourceServiceName',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'showSuggestionListTaxonomyBadge',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
    },
    {
      name: 'showUseMyLocationButtonOnDesktop',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportFieldAccess,
        update: superAdminOrSupportFieldAccess,
      },
    },
    {
      name: 'showPrintButton',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportFieldAccess,
        update: superAdminOrSupportFieldAccess,
      },
    },
    {
      name: 'turnResourceCardTaxonomiesIntoLinks',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: superAdminOrSupportFieldAccess,
        update: superAdminOrSupportFieldAccess,
      },
    },
    {
      name: 'showFeedbackButtonGlobal',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportFieldAccess,
        update: superAdminOrSupportFieldAccess,
      },
    },
    {
      name: 'showFeedbackButtonOnResourcePages',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: superAdminOrSupportFieldAccess,
        update: superAdminOrSupportFieldAccess,
      },
    },
  ],
};
