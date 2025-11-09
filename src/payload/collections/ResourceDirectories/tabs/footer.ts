import { Tab } from 'payload';
import {
  hasContentFieldAccess,
  hasSiteNavigationFieldAccess,
} from '../../Users/access/permissions';

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
        {
          name: 'href',
          type: 'text',
        },
        {
          name: 'target',
          type: 'select',
          options: [
            { label: '_self', value: '_self' },
            { label: '_blank', value: '_blank' },
          ],
        },
      ],
    },
  ],
};
