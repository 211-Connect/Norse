import { Tab } from 'payload';

import { generateUrlFields } from '@/payload/fields/urlField';

import {
  superAdminAccess,
  superAdminOrSupportOrTenantAccess,
} from '../../Users/access/roles';

export const common: Tab = {
  name: 'common',
  label: 'Alerts',
  fields: [
    {
      type: 'array',
      name: 'alert',
      maxRows: 1,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
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
        create: superAdminAccess,
        update: superAdminAccess,
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
        create: superAdminAccess,
        update: superAdminAccess,
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
