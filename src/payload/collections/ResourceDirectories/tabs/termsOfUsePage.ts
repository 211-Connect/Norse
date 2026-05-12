import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const termsOfUsePage: Tab = {
  name: 'termsOfUsePage',
  access: {
    create: superAdminOrSupportOrTenantAccess,
    update: superAdminOrSupportOrTenantAccess,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'textarea',
    },
  ],
};
