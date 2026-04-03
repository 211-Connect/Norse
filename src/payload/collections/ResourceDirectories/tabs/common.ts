import { Tab } from 'payload';
import {
  superAdminAccess,
  superAdminOrSupportOrTenantAccess,
} from '../../Users/access/roles';
import { generateUrlFields } from '@/payload/fields/urlField';

export const common: Tab = {
  name: 'common',
  fields: [
    {
      type: 'array',
      name: 'alert',
      localized: true,
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
            },
            {
              name: 'buttonText',
              type: 'text',
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
