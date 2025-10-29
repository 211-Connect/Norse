import { Tab } from 'payload';

export const newLayout: Tab = {
  name: 'newLayout',
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'headerStart',
          type: 'text',
          defaultValue: '',
          admin: {
            components: {
              Field: '@/payload/components/ColorPicker',
            },
          },
        },
        {
          name: 'headerEnd',
          type: 'text',
          defaultValue: '',
          admin: {
            components: {
              Field: '@/payload/components/ColorPicker',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'hero',
          type: 'upload',
          relationTo: 'tenant-media',
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
        },
      ],
    },
    {
      name: 'callouts',
      type: 'group',
      fields: [
        {
          name: 'options',
          type: 'array',
          localized: true,
          labels: {
            singular: 'Callout',
            plural: 'Callouts',
          },
          maxRows: 4,
          fields: [
            {
              type: 'select',
              name: 'type',
              options: ['Call', 'SMS', 'Chat', 'Email'],
              required: true,
            },
            {
              name: 'customImg',
              type: 'upload',
              relationTo: 'tenant-media',
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'url',
              type: 'text',
            },
            {
              name: 'urlTarget',
              type: 'select',
              options: ['_self', '_blank'],
              defaultValue: '_self',
            },
          ],
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
};
