import { Field } from 'payload';

export const customAttributeFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'title',
        type: 'text',
        localized: true,
        admin: {
          width: '50%',
        },
      },
      {
        name: 'subtitle',
        type: 'text',
        localized: true,
        admin: {
          width: '50%',
        },
      },
    ],
  },
  {
    name: 'description',
    type: 'text',
    localized: true,
  },
  {
    type: 'row',
    fields: [
      {
        name: 'icon',
        type: 'text',
        admin: {
          components: {
            Field: '@/payload/components/IconPicker',
          },
        },
      },
      {
        name: 'iconColor',
        type: 'text',
        defaultValue: '',
        admin: {
          components: {
            Field: '@/payload/components/ColorPicker',
          },
        },
      },
      {
        name: 'size',
        type: 'select',
        dbName: 'customAttributeSize',
        options: [
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
        ],
        defaultValue: 'sm',
      },
      {
        name: 'titleBelow',
        type: 'checkbox',
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'url',
        type: 'text',
        admin: {
          width: '70%',
        },
      },
      {
        name: 'urlTarget',
        type: 'select',
        dbName: 'urlTarget',
        options: [
          { label: 'Same Tab (_self)', value: '_self' },
          { label: 'New Tab (_blank)', value: '_blank' },
        ],
        defaultValue: '_self',
        admin: {
          width: '30%',
        },
      },
    ],
  },
];
