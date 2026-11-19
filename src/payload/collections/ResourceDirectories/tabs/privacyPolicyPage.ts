import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';
import { TEMPLATE_TAGS_DESCRIPTION } from '../templateTagsDescription';

export const privacyPolicyPage: Tab = {
  name: 'privacyPolicyPage',
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
      admin: {
        description: TEMPLATE_TAGS_DESCRIPTION,
      },
    },
  ],
};
