import { Tab } from 'payload';
import { hasSiteNavigationFieldAccess } from '../../Users/access/permissions';
import {
  parseFilter,
  validateFilterStructure,
} from '@/utils/badgeFilterEvaluator';

export const badges: Tab = {
  label: 'Badges',
  name: 'badges',
  fields: [
    {
      type: 'ui',
      name: 'badgeHint',
      admin: {
        position: 'above',
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/BadgeHint',
        },
      },
    },
    {
      name: 'list',
      type: 'array',
      access: {
        create: hasSiteNavigationFieldAccess,
        update: hasSiteNavigationFieldAccess,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'filter',
              type: 'text',
              required: true,
              admin: {
                components: {
                  Field: '@/payload/components/FilterBuilder',
                },
              },
              validate: (value) => {
                if (!value || !value.trim()) {
                  return 'Filter is required';
                }
                try {
                  const parsed = parseFilter(value);
                  validateFilterStructure(parsed);
                  return true;
                } catch (error) {
                  return error instanceof Error
                    ? error.message
                    : 'Invalid filter syntax';
                }
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'badgeLabel',
              type: 'text',
              localized: true,
              admin: {
                components: {
                  Label: '@/payload/components/LabelInfoTooltip',
                },
              },
            },
            {
              name: 'tooltip',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'style',
              type: 'select',
              options: [
                { label: 'Bold', value: 'bold' },
                { label: 'Light', value: 'light' },
                { label: 'Outline', value: 'outline' },
              ],
              defaultValue: 'bold',
              required: true,
            },
            {
              name: 'color',
              type: 'text',
              required: true,
              defaultValue: '#0044B5',
              admin: {
                components: {
                  Field: '@/payload/components/ColorPicker',
                },
              },
            },
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
              type: 'ui',
              name: 'badgePreview',
              admin: {
                components: {
                  Field: '@/payload/components/Badge/BadgePreview',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
