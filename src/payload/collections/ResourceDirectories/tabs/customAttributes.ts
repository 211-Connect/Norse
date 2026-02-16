import { Tab } from 'payload';
import { hasResourceNavigationFieldAccess } from '../../Users/access/permissions';

export const customAttributes: Tab = {
  label: 'Custom Attributes',
  name: 'customAttributes',
  fields: [
    {
      name: 'attributes',
      type: 'array',
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
      fields: [
        {
          name: 'source_column',
          type: 'text',
          required: true,
        },
        {
          name: 'link_entity',
          type: 'select',
          options: ['organization', 'service', 'location'],
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'provenance',
          type: 'text',
        },
        {
          name: 'searchable',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ],
};
