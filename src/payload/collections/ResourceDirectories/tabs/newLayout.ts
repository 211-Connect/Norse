import { Tab } from 'payload';
import { superAdminFieldAccess } from '../../Users/access/roles';
import { generateUrlFields } from '@/payload/fields/urlField';

export const newLayout: Tab = {
  name: 'newLayout',
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
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
            create: superAdminFieldAccess,
            update: superAdminFieldAccess,
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
            create: superAdminFieldAccess,
            update: superAdminFieldAccess,
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
            create: superAdminFieldAccess,
            update: superAdminFieldAccess,
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            create: superAdminFieldAccess,
            update: superAdminFieldAccess,
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
            create: superAdminFieldAccess,
            update: superAdminFieldAccess,
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
            ...generateUrlFields(),
          ],
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          access: {
            create: superAdminFieldAccess,
            update: superAdminFieldAccess,
          },
        },
      ],
    },
  ],
};
