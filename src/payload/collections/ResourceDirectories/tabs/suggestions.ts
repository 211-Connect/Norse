import { Tab } from 'payload';

export const suggestions: Tab = {
  label: 'Suggestions',
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
