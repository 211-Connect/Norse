import { Tab } from 'payload';

export const footer: Tab = {
  name: 'footer',
  fields: [
    {
      name: 'disclaimer',
      type: 'textarea',
      localized: true,
    },
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
  ],
};
