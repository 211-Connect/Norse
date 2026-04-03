import { Field, Tab } from 'payload';
import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';
import { ResourceComponentId } from '@/app/(app)/features/resource/types/component-ids';
import { title } from 'radash';
import { ResourceDirectory } from '@/payload/payload-types';
import { customAttributeFields } from '../fields/customAttributeFields';

type ResourceConfig = NonNullable<ResourceDirectory['resource']>;
type LayoutColumnGroup = NonNullable<
  ResourceConfig['leftColumn' | 'rightColumn']
>[number];
type LayoutItemField = NonNullable<LayoutColumnGroup['items']>[number];

const COMPONENT_ID_OPTIONS = Object.values(ResourceComponentId).map((id) => ({
  label: title(id),
  value: id,
}));

const layoutItemFields: Field[] = [
  {
    name: 'componentId',
    type: 'select',
    required: true,
    options: COMPONENT_ID_OPTIONS,
    admin: {
      width: '50%',
    },
  },
  {
    name: 'customAttribute',
    type: 'group',
    admin: {
      condition: (_, siblingData: LayoutItemField) =>
        siblingData?.componentId === 'customAttribute',
    },
    fields: customAttributeFields,
  },
];

const columnGroupFields: Field[] = [
  {
    name: 'isCard',
    type: 'checkbox',
    defaultValue: true,
  },
  {
    name: 'items',
    type: 'array',
    label: 'Components',
    minRows: 1,
    admin: {
      components: {
        RowLabel: {
          path: '@/payload/collections/ResourceDirectories/components/ResourceLayoutRowLabel',
        },
      },
    },
    fields: layoutItemFields,
  },
];

export const resource: Tab = {
  label: 'Resource',
  name: 'resource',
  fields: [
    {
      name: 'lastAssuredText',
      type: 'text',
      localized: true,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      name: 'useCustomLayout',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Enable custom layout for resource pages. When disabled, the default layout will be used.',
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/UseCustomLayoutField',
        },
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      type: 'ui',
      name: 'customLayoutHint',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData.useCustomLayout === true,
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/CustomLayoutHint',
        },
      },
    },
    {
      name: 'leftColumn',
      type: 'array',
      dbName: 'left_col',
      label: 'Left Column Groups',
      admin: {
        condition: (_, siblingData) => siblingData.useCustomLayout === true,
        description: 'Configure groups of components for the left column',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: columnGroupFields,
    },
    {
      name: 'rightColumn',
      type: 'array',
      dbName: 'right_col',
      label: 'Right Column Groups',
      admin: {
        condition: (_, siblingData) => siblingData.useCustomLayout === true,
        description: 'Configure groups of components for the right column',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: columnGroupFields,
    },
  ],
};
