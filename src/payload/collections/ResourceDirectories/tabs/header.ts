import { Tab } from 'payload';
import { superAdminOrSupportOrTenantFieldAccess } from '../../Users/access/roles';
import { generateUrlFields } from '@/payload/fields/urlField';

export const header: Tab = {
  name: 'header',
  fields: [
    {
      name: 'position',
      type: 'select',
      defaultValue: 'sticky',
      options: [
        {
          label: 'Sticky',
          value: 'sticky',
        },
        {
          label: 'Static',
          value: 'static',
        },
      ],
      admin: {
        description:
          'Controls whether the header sticks to the top when scrolling or stays static',
      },
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
    },
    {
      name: 'customMenu',
      type: 'array',
      localized: true,
      labels: {
        singular: 'Menu Item',
        plural: 'Menu Items',
      },
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        ...generateUrlFields('href'),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customHomeUrl',
          type: 'text',
          localized: true,
          access: {
            create: superAdminOrSupportOrTenantFieldAccess,
            update: superAdminOrSupportOrTenantFieldAccess,
          },
        },
        {
          name: 'searchUrl',
          type: 'text',
          localized: true,
          access: {
            create: superAdminOrSupportOrTenantFieldAccess,
            update: superAdminOrSupportOrTenantFieldAccess,
          },
        },
      ],
    },
    {
      name: 'safeExit',
      type: 'group',
      access: {
        create: superAdminOrSupportOrTenantFieldAccess,
        update: superAdminOrSupportOrTenantFieldAccess,
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          localized: true,
        },
        ...generateUrlFields(undefined, undefined, true),
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
};
