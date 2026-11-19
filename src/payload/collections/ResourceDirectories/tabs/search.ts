import { Field, Tab } from 'payload';

import { SearchCardComponentId } from '@/app/(app)/features/search/types/card-component-ids';

import {
  superAdminAccess,
  superAdminOrSupportOrTenantAccess,
} from '../../Users/access/roles';
import { isV2Engine, V2_ONLY_FIELD } from '../v2EngineFields';
import { customAttributeFields } from '../fields/customAttributeFields';
import { getCustomLayoutComponentLabel } from './resource';

const CARD_COMPONENT_ID_OPTIONS = Object.values(SearchCardComponentId).map(
  (id) => ({
    label: getCustomLayoutComponentLabel(id),
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
                        placeholder: 'Suggestions',
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
                      label: 'Topics Heading',
                      type: 'text',
                      localized: true,
                      admin: {
                        placeholder: 'Topics',
                        description:
                          'Deprecated: this value is now synced from Topics tab > Topics Heading Text.',
                        readOnly: true,
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
                        placeholder: 'Taxonomies',
                        description:
                          'Shown above taxonomy matches in the autocomplete dropdown. This can be renamed to terms like Services.',
                      },
                      access: {
                        create: superAdminOrSupportOrTenantAccess,
                        update: superAdminOrSupportOrTenantAccess,
                      },
                    },
                    {
                      name: 'organizations',
                      label: 'Organizations Heading',
                      type: 'text',
                      localized: true,
                      admin: {
                        placeholder: 'Organizations',
                        description:
                          'Shown above organization matches in the autocomplete dropdown. Only visible when the Enable Organization Search feature flag is on.',
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
                  admin: {
                    placeholder: 'See more',
                  },
                  access: {
                    create: superAdminOrSupportOrTenantAccess,
                    update: superAdminOrSupportOrTenantAccess,
                  },
                },
                {
                  name: 'viewDetailsButtonVariant',
                  type: 'select',
                  defaultValue: 'ghost',
                  options: [
                    {
                      label: 'Default',
                      value: 'default',
                    },
                    {
                      label: 'Secondary',
                      value: 'secondary',
                    },
                    {
                      label: 'Ghost',
                      value: 'ghost',
                    },
                    {
                      label: 'Link',
                      value: 'link',
                    },
                  ],
                  admin: {
                    description:
                      'Choose how the View Details action is displayed on search result cards.',
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
                  admin: {
                    placeholder: 'Try a different query or filter',
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
      name: 'searchSettings',
      fields: [
        {
          name: 'searchEngine',
          type: 'select',
          defaultValue: 'classic',
          options: [
            {
              label: 'Classic',
              value: 'classic',
            },
            {
              label: 'Hybrid',
              value: 'hybrid',
            },
            {
              label: 'AI Classification',
              value: 'ai_classification',
            },
            {
              label: 'v2 search',
              value: 'v2',
            },
          ],
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'pinnedResourcesMode',
          type: 'select',
          dbName: 'pinned_mode',
          defaultValue: 'boost',
          options: [
            {
              label: 'Ignore pinned status',
              value: 'ignore',
            },
            {
              label: 'Boost pinned resources in ranking',
              value: 'boost',
            },
            {
              label: 'Show pinned resources at the top',
              value: 'top',
            },
          ],
          admin: {
            description:
              'How pinned resources are ranked, for every sort order. Ignore: pinned status is not used. Top: pinned resources come first. Boost: with the Hybrid and AI Classification engines, pinned status adds to the relevance score, so pinned resources rank higher but do not always lead; the Classic engine has no score to add to, so Boost works like Top there.',
            condition: (_, siblingData) => !isV2Engine(siblingData),
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: V2_ONLY_FIELD.name,
          type: 'checkbox',
          label: V2_ONLY_FIELD.label,
          defaultValue: V2_ONLY_FIELD.defaultValue,
          admin: {
            description:
              'v2 search only. On: pinned resources rank higher inside their group. Off: pinned status is not used.',
            condition: (_, siblingData) => isV2Engine(siblingData),
          },
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
          name: 'showAllResultsOnMap',
          type: 'checkbox',
          label: 'Show all results on the map',
          defaultValue: false,
          admin: {
            description:
              'Plots up to 10,000 results of a search on the map as small circles, with the current page in the brand colour, instead of only the current page. The results list is capped at the same 10,000.',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'radiusSelectValues',
          type: 'array',
          label: 'Address search: radius options',
          admin: {
            description:
              'Used only when a visitor searches near an address. Picking a state, county, city or ZIP code shows no radius.',
          },
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
          label: 'Address search: default radius',
          admin: {
            description:
              'Used only when a visitor searches near an address. Picking a state, county, city or ZIP code shows no radius. Must match one of the radius values above.',
          },
          name: 'defaultRadius',
          type: 'number',
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'areaMatchMode',
          type: 'select',
          dbName: 'area_match',
          label: 'Area search: which resources to list',
          defaultValue: 'located_or_serving',
          options: [
            {
              label: 'Only resources with an address in the area',
              value: 'located',
            },
            {
              label:
                'Resources with an address in the area, plus resources without an address that serve it',
              value: 'located_or_serving',
            },
            {
              label:
                'Every resource that serves the area, wherever its address is',
              value: 'serving',
            },
          ],
          admin: {
            description:
              'Used when a visitor picks a state, county, city or ZIP code; picking an address still searches a radius around it. A resource "serves" the area when its service area overlaps any part of it. Resources without an address are virtual services, hotlines and PO boxes. The last option also lists resources based elsewhere, such as a statewide hotline with an office in another county.',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'unlocatedInAreaSearch',
          type: 'select',
          dbName: 'unlocated',
          label: 'Area search: resources with no address and no service area',
          defaultValue: 'virtual',
          options: [
            {
              label: 'Leave them out',
              value: 'none',
            },
            {
              label: 'List virtual services only',
              value: 'virtual',
            },
            {
              label: 'List all of them',
              value: 'all',
            },
          ],
          admin: {
            description:
              'They cannot be placed in any area, so each one is listed in every area search or in none. A virtual service with no service area usually serves everyone. "All" also lists physical services that are missing their address.',
            condition: (_, siblingData) => !isV2Engine(siblingData),
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
      ],
    },
    {
      name: 'facetsImportExport',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/collections/ResourceDirectories/components/BulkCsvImportExport',
            clientProps: {
              kind: 'facets',
            },
          },
        },
      },
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
        {
          name: 'sortBy',
          type: 'select',
          defaultValue: 'count',
          admin: {
            description:
              'Count keeps API-provided order. Name sorts by localized label. Custom Value Order sorts by configured English/raw facet values. Day of Week sorts Sunday to Saturday and supports values like Sunday/Sun, Monday/Mon, etc.',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
          options: [
            {
              label: 'Count',
              value: 'count',
            },
            {
              label: 'Name',
              value: 'name',
            },
            {
              label: 'Custom Value Order',
              value: 'valueOrder',
            },
            {
              label: 'Day of Week',
              value: 'dayOfWeek',
            },
          ],
        },
        {
          name: 'valueOrder',
          type: 'array',
          label: 'Custom Value Order',
          admin: {
            condition: (_, siblingData) => siblingData?.sortBy === 'valueOrder',
            description:
              'Order values by English/raw facet values from the search API (e.g. Sunday|Monday...). Values not listed appear after listed values.',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'excludeValues',
          type: 'array',
          label: 'Exclude Filter Values',
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
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
