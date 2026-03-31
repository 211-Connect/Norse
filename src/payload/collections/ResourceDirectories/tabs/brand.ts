import { Tab } from 'payload';
import { superAdminOrSupportOrTenantFieldAccess } from '../../Users/access/roles';

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
            update: superAdminOrSupportOrTenantFieldAccess,
            create: superAdminOrSupportOrTenantFieldAccess,
          },
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'tenant-media',
          required: true,
          access: {
            update: superAdminOrSupportOrTenantFieldAccess,
            create: superAdminOrSupportOrTenantFieldAccess,
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
            update: superAdminOrSupportOrTenantFieldAccess,
            create: superAdminOrSupportOrTenantFieldAccess,
          },
        },
        {
          name: 'openGraph',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            update: superAdminOrSupportOrTenantFieldAccess,
            create: superAdminOrSupportOrTenantFieldAccess,
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
            update: superAdminOrSupportOrTenantFieldAccess,
            create: superAdminOrSupportOrTenantFieldAccess,
          },
        },
        {
          name: 'feedbackUrl',
          type: 'text',
          access: {
            create: superAdminOrSupportOrTenantFieldAccess,
            update: superAdminOrSupportOrTenantFieldAccess,
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
            create: superAdminOrSupportOrTenantFieldAccess,
            update: superAdminOrSupportOrTenantFieldAccess,
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
                update: superAdminOrSupportOrTenantFieldAccess,
                create: superAdminOrSupportOrTenantFieldAccess,
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
                update: superAdminOrSupportOrTenantFieldAccess,
                create: superAdminOrSupportOrTenantFieldAccess,
              },
            },
            {
              name: 'borderRadius',
              type: 'text',
              required: true,
              access: {
                update: superAdminOrSupportOrTenantFieldAccess,
                create: superAdminOrSupportOrTenantFieldAccess,
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
                update: superAdminOrSupportOrTenantFieldAccess,
                create: superAdminOrSupportOrTenantFieldAccess,
              },
            },
            {
              name: 'description',
              type: 'text',
              localized: true,
              access: {
                update: superAdminOrSupportOrTenantFieldAccess,
                create: superAdminOrSupportOrTenantFieldAccess,
              },
            },
          ],
        },
      ],
    },
  ],
};
