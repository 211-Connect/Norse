import { Tab } from 'payload';
import {
  hasFeatureFieldAccess,
  hasSiteNavigationFieldAccess,
} from '../../Users/access/permissions';
import { generateUrlFields } from '@/payload/fields/urlField';

export const header: Tab = {
  name: 'header',
  fields: [
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
    {
      type: 'row',
      fields: [
        {
          name: 'customHomeUrl',
          type: 'text',
          localized: true,
          access: {
            create: hasSiteNavigationFieldAccess,
            update: hasSiteNavigationFieldAccess,
          },
        },
        {
          name: 'searchUrl',
          type: 'text',
          localized: true,
          access: {
            create: hasSiteNavigationFieldAccess,
            update: hasSiteNavigationFieldAccess,
          },
        },
      ],
    },
    {
      name: 'safeExit',
      type: 'group',
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          localized: true,
        },
        ...generateUrlFields(undefined, undefined, true),
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
};
