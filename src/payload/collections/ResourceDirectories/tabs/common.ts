import { Tab } from 'payload';

import { generateUrlFields } from '@/payload/fields/urlField';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const common: Tab = {
  name: 'common',
  label: 'Alerts',
  fields: [
    {
      type: 'array',
      name: 'alert',
      validate: (value) => {
        const activeAlertsCount = (Array.isArray(value) ? value : []).filter(
          (alertItem) =>
            Boolean((alertItem as { isActive?: boolean } | null)?.isActive),
        ).length;

        if (activeAlertsCount > 1) {
          return 'Only one alert can be active at a time.';
        }

        return true;
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          label: 'Active',
          admin: {
            description: 'Show this alert on the home page',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'text',
              type: 'textarea',
              required: true,
              localized: true,
            },
            {
              name: 'buttonText',
              type: 'text',
              localized: true,
            },
          ],
        },
        ...generateUrlFields(),
        {
          name: 'variant',
          type: 'select',
          options: [
            {
              label: 'Urgent (Red)',
              value: 'destructive',
            },
            { label: 'Default (neutral)', value: 'default' },
          ],
          defaultValue: 'destructive',
        },
      ],
    },
    {
      name: 'customDataProvidersHeading',
      type: 'text',
      localized: true,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      admin: {
        placeholder: 'Provided by',
      },
    },
    {
      name: 'dataProviders',
      type: 'array',
      localized: true,
      labels: {
        singular: 'Data Provider',
        plural: 'Data Providers',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        ...generateUrlFields(),
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
        },
      ],
    },
  ],
};
