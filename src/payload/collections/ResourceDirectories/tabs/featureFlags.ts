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
      name: 'enableOrganizationSearch',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      name: 'showSuggestionListOrganizationLocationBadge',
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
    {
      name: 'showAgeFilter',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enablePrintableDirectories',
          type: 'checkbox',
          defaultValue: false,
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'maxResourcesConfigurable',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            condition: (_, siblingData) =>
              Boolean(siblingData?.enablePrintableDirectories),
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'defaultMaxResources',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 1000,
          admin: {
            condition: (_, siblingData) =>
              Boolean(siblingData?.enablePrintableDirectories),
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'printableDirectoriesAllowedEmails',
          type: 'array',
          dbName: 'pd_allow_emails',
          label: 'Allowed Emails',
          admin: {
            condition: (_, siblingData) =>
              Boolean(siblingData?.enablePrintableDirectories),
          },
          labels: {
            singular: 'Email',
            plural: 'Allowed Emails',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
          ],
        },
        {
          name: 'printableDirectoriesAllowedDomains',
          type: 'array',
          dbName: 'pd_allow_domains',
          label: 'Allowed Domains',
          admin: {
            condition: (_, siblingData) =>
              Boolean(siblingData?.enablePrintableDirectories),
          },
          labels: {
            singular: 'Domain',
            plural: 'Allowed Domains',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
          fields: [
            {
              name: 'domain',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
