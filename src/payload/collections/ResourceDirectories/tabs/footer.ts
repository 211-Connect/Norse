import { Tab } from 'payload';

import { customMenuField } from '@/payload/fields/customMenuField';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';
import { TEMPLATE_TAGS_DESCRIPTION } from '../templateTagsDescription';

export const footer: Tab = {
  name: 'footer',
  fields: [
    {
      name: 'disclaimer',
      type: 'textarea',
      localized: true,
      admin: {
        description: TEMPLATE_TAGS_DESCRIPTION,
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    customMenuField('footer'),
    {
      name: 'copyright',
      type: 'text',
      admin: {
        description: TEMPLATE_TAGS_DESCRIPTION,
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
  ],
};
