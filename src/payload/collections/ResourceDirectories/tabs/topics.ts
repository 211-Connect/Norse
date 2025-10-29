import { Tab } from 'payload';

export const topics: Tab = {
  label: 'Topics',
  name: 'topics',
  fields: [
    {
      type: 'text',
      name: 'backText',
      localized: true,
    },
    {
      type: 'text',
      name: 'customHeading',
      localized: true,
    },
    {
      type: 'select',
      name: 'iconSize',
      options: ['small', 'medium'],
      defaultValue: 'small',
    },
    {
      name: 'list',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'tenant-media',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'href',
              type: 'text',
            },
            {
              name: 'target',
              type: 'select',
              options: ['_self', '_blank'],
            },
          ],
        },
        {
          name: 'subtopics',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'queryType',
                  type: 'select',
                  options: ['taxonomy', 'text'],
                },
              ],
            },
            {
              name: 'query',
              type: 'text',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'href',
                  type: 'text',
                },
                {
                  name: 'target',
                  type: 'select',
                  options: ['_self', '_blank'],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
