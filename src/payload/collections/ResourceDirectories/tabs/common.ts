import { Tab } from 'payload';
import {
  hasLayoutFieldAccess,
  hasResourceNavigationFieldAccess,
} from '../../Users/access/permissions';
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
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
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
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
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
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
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
