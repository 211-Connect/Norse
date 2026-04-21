import { Field, Tab } from 'payload';
import {
  superAdminAccess,
  superAdminOrSupportOrTenantAccess,
} from '../../Users/access/roles';
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
          type: 'group',
          label: 'Home and Search Bar',
          admin: {
            description:
              'Customize the main search heading and the placeholder text shown on the home page and within the primary search inputs.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                  access: {
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
                  },
                },
                {
                  name: 'queryInputPlaceholder',
                  type: 'text',
                  localized: true,
                  access: {
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
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
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
                  },
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          label: 'Search Suggestions',
          admin: {
            description:
              'Customize the section titles shown inside the search autocomplete dropdown beneath the main search field. These labels appear above grouped suggestions such as Suggestions, Categories, and Taxonomies/Services.',
          },
          fields: [
            {
              type: 'group',
              name: 'suggestionHeaders',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'suggestions',
                      label: 'Suggestions Heading',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Shown above free-text search suggestions in the autocomplete dropdown.',
                      },
                      access: {
                        create: superAdminOrSupportOrTenantAccess,
                        update: superAdminOrSupportOrTenantAccess,
                      },
                    },
                    {
                      name: 'categories',
                      label: 'Categories Heading',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Shown above topic/category matches in the autocomplete dropdown.',
                      },
                      access: {
                        create: superAdminOrSupportOrTenantAccess,
                        update: superAdminOrSupportOrTenantAccess,
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'taxonomies',
                      label: 'Taxonomies Heading',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Shown above taxonomy matches in the autocomplete dropdown. This can be renamed to terms like Services.',
                      },
                      access: {
                        create: superAdminOrSupportOrTenantAccess,
                        update: superAdminOrSupportOrTenantAccess,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          label: 'Search Results',
          admin: {
            description:
              'Customize text shown after a search is run, including the call to action on result cards and the fallback message displayed when no results are found.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'viewDetailsText',
                  type: 'text',
                  localized: true,
                  access: {
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
                  },
                },
                {
                  name: 'useTextLinkForViewDetails',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description:
                      'Display the View Details action as an underlined text link instead of the default button-style action.',
                  },
                  access: {
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'noResultsFallbackText',
                  type: 'textarea',
                  localized: true,
                  access: {
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
                  },
                },
              ],
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
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'resultsLimit',
          type: 'number',
          defaultValue: 25,
          min: 25,
          required: true,
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
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
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
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
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
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
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
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
        create: superAdminAccess,
        update: superAdminAccess,
      },
    },
    {
      name: 'cardLayout',
      type: 'array',
      label: 'Card Layout',
      admin: {
        condition: (_, siblingData) => siblingData.useCustomCardLayout === true,
        description: 'Configure the layout components for search result cards',
        components: {
          RowLabel:
            '@/payload/collections/ResourceDirectories/components/ResourceLayoutRowLabel',
        },
      },
      access: {
        create: superAdminAccess,
        update: superAdminAccess,
      },
      fields: cardLayoutItemFields,
    },
    {
      type: 'group',
      name: 'map',
      access: {
        create: superAdminAccess,
        update: superAdminAccess,
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
