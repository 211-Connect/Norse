import { Field, Tab } from 'payload';
import {
  hasPropertySettingsFieldAccess,
  hasSearchFieldAccess,
  hasLayoutFieldAccess,
} from '../../Users/access/permissions';
import { SearchCardComponentId } from '@/app/(app)/features/search/types/card-component-ids';
import { title } from 'radash';
import { customAttributeFields } from '../fields/customAttributeFields';

const CARD_COMPONENT_ID_OPTIONS = Object.values(SearchCardComponentId).map(
  (id) => ({
    label: title(id),
    value: id,
  }),
);

const cardLayoutItemFields: Field[] = [
  {
    name: 'componentId',
    type: 'select',
    required: true,
    options: CARD_COMPONENT_ID_OPTIONS,
  },
  {
    name: 'customAttribute',
    type: 'group',
    admin: {
      condition: (_, siblingData: any) =>
        siblingData?.componentId === SearchCardComponentId.CUSTOM_ATTRIBUTE,
    },
    fields: customAttributeFields,
  },
];

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
              access: {
                create: hasSearchFieldAccess,
                update: hasSearchFieldAccess,
              },
            },
            {
              name: 'queryInputPlaceholder',
              type: 'text',
              localized: true,
              access: {
                create: hasSearchFieldAccess,
                update: hasSearchFieldAccess,
              },
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
              access: {
                create: hasSearchFieldAccess,
                update: hasSearchFieldAccess,
              },
            },
            {
              name: 'noResultsFallbackText',
              type: 'textarea',
              localized: true,
              access: {
                create: hasSearchFieldAccess,
                update: hasSearchFieldAccess,
              },
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
          name: 'hybridSemanticSearchEnabled',
          type: 'checkbox',
          defaultValue: false,
          access: {
            create: hasSearchFieldAccess,
            update: hasSearchFieldAccess,
          },
        },
        {
          name: 'resultsLimit',
          type: 'number',
          defaultValue: 25,
          min: 25,
          required: true,
          access: {
            create: hasSearchFieldAccess,
            update: hasSearchFieldAccess,
          },
        },
        {
          name: 'radiusSelectValues',
          type: 'array',
          labels: {
            singular: 'Radius Option',
            plural: 'Radius Options',
          },
          access: {
            create: hasSearchFieldAccess,
            update: hasSearchFieldAccess,
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
          access: {
            create: hasSearchFieldAccess,
            update: hasSearchFieldAccess,
          },
        },
      ],
    },
    {
      name: 'facets',
      type: 'array',
      admin: {
        components: {
          RowLabel:
            '@/payload/collections/ResourceDirectories/components/FacetsRowLabel',
        },
      },
      labels: {
        singular: 'Facet',
        plural: 'Facets',
      },
      access: {
        create: hasSearchFieldAccess,
        update: hasSearchFieldAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          localized: true,
        },
        {
          name: 'facet',
          type: 'text',
          required: true,
        },
        {
          name: 'showInDetails',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'useCustomCardLayout',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Enable custom layout for search result cards. When disabled, the default layout will be used.',
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/UseCustomCardLayoutField',
        },
      },
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
    {
      name: 'cardLayout',
      type: 'array',
      label: 'Card Layout',
      admin: {
        condition: (_, siblingData) => siblingData.useCustomCardLayout === true,
        description: 'Configure the layout components for search result cards',
      },
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
      fields: cardLayoutItemFields,
    },
    {
      type: 'group',
      name: 'map',
      access: {
        create: hasPropertySettingsFieldAccess,
        update: hasPropertySettingsFieldAccess,
      },
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
