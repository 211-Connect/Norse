import { Tab } from 'payload';
import { superAdminOrSupportOrTenantFieldAccess } from '../../Users/access/roles';

export const privacyPolicyPage: Tab = {
  name: 'privacyPolicyPage',
  access: {
    create: superAdminOrSupportOrTenantFieldAccess,
    update: superAdminOrSupportOrTenantFieldAccess,
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
