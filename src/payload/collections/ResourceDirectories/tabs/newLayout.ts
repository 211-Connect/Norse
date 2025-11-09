import { Tab } from 'payload';
import { hasLayoutFieldAccess } from '../../Users/access/permissions';

export const newLayout: Tab = {
  name: 'newLayout',
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
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
          access: {
            create: hasLayoutFieldAccess,
            update: hasLayoutFieldAccess,
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
          access: {
            create: hasLayoutFieldAccess,
            update: hasLayoutFieldAccess,
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
          access: {
            create: hasLayoutFieldAccess,
            update: hasLayoutFieldAccess,
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            create: hasLayoutFieldAccess,
            update: hasLayoutFieldAccess,
          },
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
          access: {
            create: hasLayoutFieldAccess,
            update: hasLayoutFieldAccess,
          },
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
          access: {
            create: hasLayoutFieldAccess,
            update: hasLayoutFieldAccess,
          },
        },
      ],
    },
  ],
};
