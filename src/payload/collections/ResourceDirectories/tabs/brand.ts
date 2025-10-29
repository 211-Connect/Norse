import { Tab } from 'payload';

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
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'tenant-media',
          required: true,
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
          name: 'openGraph',
          type: 'upload',
          relationTo: 'tenant-media',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'copyright',
          type: 'text',
        },
        {
          name: 'feedbackUrl',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phoneNumber',
          type: 'text',
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
            },
            {
              name: 'borderRadius',
              type: 'text',
              required: true,
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
            },
            {
              name: 'description',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
};
