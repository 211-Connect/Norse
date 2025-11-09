import { Tab } from 'payload';
import { hasResourceNavigationFieldAccess } from '../../Users/access/permissions';

export const suggestions: Tab = {
  label: 'Suggestions',
  access: {
    create: hasResourceNavigationFieldAccess,
    update: hasResourceNavigationFieldAccess,
  },
  fields: [
    {
      name: 'suggestions',
      type: 'array',
      required: true,
      localized: true,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
            {
              name: 'taxonomies',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
