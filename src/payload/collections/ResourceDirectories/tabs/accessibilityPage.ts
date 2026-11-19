import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';
import { TEMPLATE_TAGS_DESCRIPTION } from '../templateTagsDescription';

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
      admin: {
        description: TEMPLATE_TAGS_DESCRIPTION,
      },
    },
  ],
};
