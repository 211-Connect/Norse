import { Tab } from 'payload';

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
        },
        {
          name: 'searchUrl',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'safeExit',
      type: 'group',
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
