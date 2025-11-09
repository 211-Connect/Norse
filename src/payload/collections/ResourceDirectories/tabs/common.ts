import { Tab } from 'payload';
import {
  hasLayoutFieldAccess,
  hasResourceNavigationFieldAccess,
} from '../../Users/access/permissions';

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
        {
          type: 'row',
          fields: [
            {
              name: 'url',
              type: 'text',
            },
            {
              name: 'variant',
              type: 'select',
              options: ['default', 'destructive'],
              defaultValue: 'destructive',
            },
          ],
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
        {
          name: 'url',
          type: 'text',
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
        },
      ],
    },
  ],
};
