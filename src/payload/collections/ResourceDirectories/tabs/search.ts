import { Tab } from 'payload';

export const search: Tab = {
  name: 'search',
  fields: [
    {
      type: 'group',
      name: 'texts',
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
              name: 'queryInputPlaceholder',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'locationInputPlaceholder',
              type: 'text',
              localized: true,
            },
            {
              name: 'noResultsFallbackText',
              type: 'textarea',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'searchSettings',
      fields: [
        {
          name: 'resultsLimit',
          type: 'number',
          defaultValue: 25,
          min: 25,
          required: true,
        },
        {
          name: 'radiusSelectValues',
          type: 'array',
          labels: {
            singular: 'Radius Option',
            plural: 'Radius Options',
          },
          fields: [
            {
              name: 'value',
              type: 'number',
              required: true,
            },
          ],
        },
        {
          admin: {
            description: 'Must match one of the radius values above',
          },
          name: 'defaultRadius',
          type: 'number',
        },
      ],
    },
    {
      type: 'group',
      name: 'map',
      fields: [
        {
          name: 'center',
          type: 'code',
          required: true,
        },
        {
          name: 'zoom',
          type: 'number',
          required: true,
        },
      ],
    },
  ],
};
