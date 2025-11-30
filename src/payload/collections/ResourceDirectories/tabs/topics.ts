import { Tab } from 'payload';
import {
  hasLayoutFieldAccess,
  hasResourceNavigationFieldAccess,
  hasSiteNavigationFieldAccess,
} from '../../Users/access/permissions';

export const topics: Tab = {
  label: 'Topics',
  name: 'topics',
  fields: [
    {
      type: 'text',
      name: 'backText',
      localized: true,
      access: {
        create: hasSiteNavigationFieldAccess,
        update: hasSiteNavigationFieldAccess,
      },
    },
    {
      type: 'text',
      name: 'customHeading',
      localized: true,
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      type: 'select',
      name: 'iconSize',
      options: ['small', 'medium'],
      defaultValue: 'small',
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'imageBorderRadius',
      type: 'number',
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      name: 'list',
      type: 'array',
      localized: true,
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
      admin: {
        components: {
          RowLabel:
            '@/payload/collections/ResourceDirectories/components/TopicsRowLabel',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'tenant-media',
            },
          ],
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
          admin: {
            components: {
              RowLabel:
                '@/payload/collections/ResourceDirectories/components/TopicsRowLabel',
            },
          },
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
