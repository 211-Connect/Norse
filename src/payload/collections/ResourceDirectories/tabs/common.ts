import { Tab } from 'payload';
import {
  superAdminFieldAccess,
  superAdminOrSupportOrTenantFieldAccess,
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
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
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
      name: 'smsProvider',
      type: 'select',
      options: ['Twilio'],
    },
    {
      name: 'customDataProvidersHeading',
      type: 'text',
      localized: true,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
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
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
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
