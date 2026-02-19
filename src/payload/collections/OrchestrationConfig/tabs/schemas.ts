import { Tab } from 'payload';

export const schemas: Tab = {
  label: 'Schemas',
  fields: [
    {
      name: 'schemas',
      type: 'array',
      admin: {
        components: {
          RowLabel:
            '@/payload/collections/OrchestrationConfig/components/SchemasRowLabel',
        },
      },
      fields: [
        {
          name: 'schemaName',
          type: 'text',
          required: true,
          admin: {
            description:
              'Name of the schema for this configuration (e.g. NE211)',
          },
        },
        {
          name: 'customAttributes',
          type: 'array',
          label: 'Custom Attributes',
          admin: {
            components: {
              RowLabel:
                '@/payload/collections/OrchestrationConfig/components/CustomAttributesRowLabel',
            },
          },
          fields: [
            {
              name: 'source_column',
              type: 'text',
              required: true,
              label: 'Source Column',
            },
            {
              name: 'link_entity',
              type: 'select',
              options: ['organization', 'service', 'location'],
              required: true,
              label: 'Link Entity',
            },
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
              label: 'Label',
            },
            {
              name: 'provenance',
              type: 'text',
              label: 'Provenance',
            },
            {
              name: 'searchable',
              type: 'checkbox',
              defaultValue: true,
              label: 'Searchable',
            },
          ],
        },
      ],
    },
  ],
};
