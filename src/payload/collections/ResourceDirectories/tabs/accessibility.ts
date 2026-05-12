import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const accessibility: Tab = {
  name: 'accessibility',
  fields: [
    {
      name: 'fontSizeAdjustment',
      type: 'select',
      options: ['150%', '175%', '200%'],
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
  ],
};
