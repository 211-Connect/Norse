import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const brand: Tab = {
  name: 'brand',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'tenant-media',
          required: true,
          access: {
            update: superAdminOrSupportOrTenantAccess,
            create: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'tenant-media',
          required: true,
          access: {
            update: superAdminOrSupportOrTenantAccess,
            create: superAdminOrSupportOrTenantAccess,
          },
          admin: {
            components: {
              Label: '@/payload/components/LabelInfoTooltip',
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
          label: 'Hero Image',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            update: superAdminOrSupportOrTenantAccess,
            create: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'openGraph',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            update: superAdminOrSupportOrTenantAccess,
            create: superAdminOrSupportOrTenantAccess,
          },
          admin: {
            components: {
              Label: '@/payload/components/LabelInfoTooltip',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'copyright',
          type: 'text',
          access: {
            update: superAdminOrSupportOrTenantAccess,
            create: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'feedbackUrl',
          type: 'text',
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phoneNumber',
          type: 'text',
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'theme',
      required: true,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'primaryColor',
              type: 'text',
              required: true,
              admin: {
                components: {
                  Field: '@/payload/components/ColorPicker',
                },
              },
              access: {
                update: superAdminOrSupportOrTenantAccess,
                create: superAdminOrSupportOrTenantAccess,
              },
            },
            {
              name: 'secondaryColor',
              type: 'text',
              required: true,
              admin: {
                components: {
                  Field: '@/payload/components/ColorPicker',
                },
              },
              access: {
                update: superAdminOrSupportOrTenantAccess,
                create: superAdminOrSupportOrTenantAccess,
              },
            },
            {
              name: 'borderRadius',
              type: 'text',
              required: true,
              access: {
                update: superAdminOrSupportOrTenantAccess,
                create: superAdminOrSupportOrTenantAccess,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'meta',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              access: {
                update: superAdminOrSupportOrTenantAccess,
                create: superAdminOrSupportOrTenantAccess,
              },
            },
            {
              name: 'description',
              type: 'text',
              localized: true,
              access: {
                update: superAdminOrSupportOrTenantAccess,
                create: superAdminOrSupportOrTenantAccess,
              },
            },
          ],
        },
      ],
    },
  ],
};
