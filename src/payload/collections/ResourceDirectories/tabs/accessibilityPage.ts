import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const accessibilityPage: Tab = {
  name: 'accessibilityPage',
  access: {
    create: superAdminOrSupportOrTenantAccess,
    update: superAdminOrSupportOrTenantAccess,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Accessibility',
    },
    {
      name: 'content',
      type: 'textarea',
    },
  ],
};
