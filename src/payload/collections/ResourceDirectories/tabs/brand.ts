import { Tab } from 'payload';
import {
  hasContactFieldAccess,
  hasThemeFieldAccess,
} from '../../Users/access/permissions';

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
            update: hasThemeFieldAccess,
            create: hasThemeFieldAccess,
          },
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'tenant-media',
          required: true,
          access: {
            update: hasThemeFieldAccess,
            create: hasThemeFieldAccess,
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
            update: hasThemeFieldAccess,
            create: hasThemeFieldAccess,
          },
        },
        {
          name: 'openGraph',
          type: 'upload',
          relationTo: 'tenant-media',
          access: {
            update: hasThemeFieldAccess,
            create: hasThemeFieldAccess,
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
            update: hasThemeFieldAccess,
            create: hasThemeFieldAccess,
          },
        },
        {
          name: 'feedbackUrl',
          type: 'text',
          access: {
            create: hasContactFieldAccess,
            update: hasContactFieldAccess,
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
            create: hasContactFieldAccess,
            update: hasContactFieldAccess,
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
                update: hasThemeFieldAccess,
                create: hasThemeFieldAccess,
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
                update: hasThemeFieldAccess,
                create: hasThemeFieldAccess,
              },
            },
            {
              name: 'borderRadius',
              type: 'text',
              required: true,
              access: {
                update: hasThemeFieldAccess,
                create: hasThemeFieldAccess,
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
                update: hasThemeFieldAccess,
                create: hasThemeFieldAccess,
              },
            },
            {
              name: 'description',
              type: 'text',
              localized: true,
              access: {
                update: hasThemeFieldAccess,
                create: hasThemeFieldAccess,
              },
            },
          ],
        },
      ],
    },
  ],
};
