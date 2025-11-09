import { Tab } from 'payload';
import {
  hasFeatureFieldAccess,
  hasSiteNavigationFieldAccess,
} from '../../Users/access/permissions';

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
        {
          name: 'url',
          type: 'text',
          localized: true,
        },
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
};
