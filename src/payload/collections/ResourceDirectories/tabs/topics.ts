import { Tab } from 'payload';
import {
  superAdminFieldAccess,
  superAdminOrSupportOrTenantFieldAccess,
} from '../../Users/access/roles';
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
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
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
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
    },
    {
      type: 'select',
      name: 'iconSize',
      options: ['small', 'medium'],
      defaultValue: 'small',
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'imageBorderRadius',
      type: 'number',
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
    },
    {
      name: 'list',
      type: 'array',
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
      admin: {
        components: {
          RowLabel: {
            path: '@/payload/collections/ResourceDirectories/components/LocalizedRowLabel',
            clientProps: {
              path: 'topics.list',
              localizedFieldKey: 'name',
            },
          },
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
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
                  localized: true,
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
