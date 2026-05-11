import { Tab } from 'payload';

import { generateUrlFields } from '@/payload/fields/urlField';

import { superAdminAccess } from '../../Users/access/roles';

export const newLayout: Tab = {
  name: 'newLayout',
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: superAdminAccess,
        update: superAdminAccess,
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
            create: superAdminAccess,
            update: superAdminAccess,
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
            create: superAdminAccess,
            update: superAdminAccess,
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
            create: superAdminAccess,
            update: superAdminAccess,
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            create: superAdminAccess,
            update: superAdminAccess,
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
          labels: {
            singular: 'Callout',
            plural: 'Callouts',
          },
          maxRows: 4,
          access: {
            create: superAdminAccess,
            update: superAdminAccess,
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
              localized: true,
              type: 'textarea',
            },
            {
              name: 'title',
              localized: true,
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
            create: superAdminAccess,
            update: superAdminAccess,
          },
        },
      ],
    },
  ],
};
