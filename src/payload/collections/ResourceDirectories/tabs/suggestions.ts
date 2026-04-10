import { Tab } from 'payload';
import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const suggestions: Tab = {
  label: 'Suggestions',
  access: {
    create: superAdminOrSupportOrTenantAccess,
    update: superAdminOrSupportOrTenantAccess,
  },
  fields: [
    {
      name: 'suggestions',
      type: 'array',
      required: true,
      admin: {
        components: {
          RowLabel:
            '@/payload/collections/ResourceDirectories/components/SuggestionsRowLabel',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              label: 'Text',
              localized: true,
            },
            {
              name: 'taxonomies',
              type: 'text',
              required: true,
              admin: {
                components: {
                  Label: '@/payload/components/LabelInfoTooltip',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
