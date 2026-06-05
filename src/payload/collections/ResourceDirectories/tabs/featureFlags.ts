import { Tab } from 'payload';

import {
  superAdminAccess,
  superAdminOrSupportAccess,
  superAdminOrSupportOrTenantAccess,
} from '../../Users/access/roles';

export const featureFlags: Tab = {
  name: 'featureFlags',
  fields: [
    {
      name: 'showHomePageTour',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
    },
    {
      name: 'requireUserLocation',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      name: 'showSearchAndResourceServiceName',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminAccess,
        update: superAdminAccess,
      },
    },
    {
      name: 'showSuggestionListTaxonomyBadge',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      name: 'showUseMyLocationButtonOnDesktop',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
    },
    {
      name: 'showPrintButton',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
    },
    {
      name: 'turnResourceCardTaxonomiesIntoLinks',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
    },
    {
      name: 'showFeedbackButtonGlobal',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
    },
    {
      name: 'showFeedbackButtonOnResourcePages',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
    },
    {
      name: 'requireAuthenticationForFavorites',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
  ],
};
