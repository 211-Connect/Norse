import { Tab } from 'payload';
import {
  hasContentFieldAccess,
  hasSiteNavigationFieldAccess,
} from '../../Users/access/permissions';
import { generateUrlFields } from '@/payload/fields/urlField';

export const footer: Tab = {
  name: 'footer',
  fields: [
    {
      name: 'disclaimer',
      type: 'textarea',
      localized: true,
      access: {
        create: hasContentFieldAccess,
        update: hasContentFieldAccess,
      },
    },
    {
      name: 'customMenu',
      type: 'array',
      localized: true,
      labels: {
        singular: 'Menu Item',
        plural: 'Menu Items',
      },
      access: {
        create: hasSiteNavigationFieldAccess,
        update: hasSiteNavigationFieldAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        ...generateUrlFields('href'),
      ],
    },
  ],
};
