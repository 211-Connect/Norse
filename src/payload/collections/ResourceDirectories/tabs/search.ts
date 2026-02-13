import { Tab } from 'payload';
import {
  hasPropertySettingsFieldAccess,
  hasSearchFieldAccess,
} from '../../Users/access/permissions';

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
