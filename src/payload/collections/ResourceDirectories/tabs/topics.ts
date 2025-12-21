import { Tab } from 'payload';
import {
  hasLayoutFieldAccess,
  hasResourceNavigationFieldAccess,
  hasSiteNavigationFieldAccess,
} from '../../Users/access/permissions';
import { generateUrlFields } from '@/payload/fields/urlField';

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
      label: 'Topics Heading Text',
      defaultValue: 'Topics',
      admin: {
        placeholder: 'Topics',
      },
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
          admin: {
            condition: (_, siblingData) => {
              return (
                !siblingData?.subtopics || siblingData?.subtopics?.length === 0
              );
            },
          },
          fields: generateUrlFields('href'),
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
                  options: ['taxonomy', 'text', 'link'],
                },
              ],
            },
            {
              name: 'query',
              type: 'text',
              admin: {
                components: {
                  Label:
                    '@/payload/collections/ResourceDirectories/components/TopicsLabelInfoTooltip',
                },
                condition: (_, siblingData) => {
                  return (
                    siblingData?.queryType && siblingData?.queryType !== 'link'
                  );
                },
              },
            },
            {
              type: 'row',
              admin: {
                condition: (_, siblingData) => {
                  return siblingData?.queryType === 'link';
                },
              },
              fields: generateUrlFields('href'),
            },
          ],
        },
      ],
    },
  ],
};
