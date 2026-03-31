import { Tab } from 'payload';
import { superAdminOrSupportOrTenantFieldAccess } from '../../Users/access/roles';
import { generateUrlFields } from '@/payload/fields/urlField';

export const footer: Tab = {
  name: 'footer',
  fields: [
    {
      name: 'disclaimer',
      type: 'textarea',
      localized: true,
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
  ],
};
