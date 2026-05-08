import { generateUrlFields } from '@/payload/fields/urlField';
import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

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
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
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
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
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
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'searchUrl',
          type: 'text',
          localized: true,
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'favoritesButtonLabel',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Leave blank to use the default "My Stuff" label (or locale equivalent)',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
        {
          name: 'feedbackButtonLabel',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Leave blank to use the default feedback label ("Report" or locale equivalent)',
          },
          access: {
            create: superAdminOrSupportOrTenantAccess,
            update: superAdminOrSupportOrTenantAccess,
          },
        },
      ],
    },
    {
      name: 'safeExit',
      type: 'group',
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
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
