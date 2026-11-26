import { ArrayField, TextFieldSingleValidation } from 'payload';

import { defaultLocale } from '@/payload/i18n/locales';

import { superAdminOrSupportOrTenantAccess } from '../collections/Users/access/roles';
import { generateUrlFields } from './urlField';

/**
 * The name is required in English only: other locales may leave it blank,
 * and the app then shows the English name (`buildAppConfig`).
 */
const validateMenuItemName: TextFieldSingleValidation = (value, { req }) => {
  if (value?.trim()) return true;
  if (req.locale && req.locale !== defaultLocale) return true;
  return 'The English name is required.';
};

/**
 * A header or footer menu. The links are the same in every locale; only
 * each item's name is translated. See docs/custom-menu.md.
 *
 * It is stored in its own tables (`rds_header_menu`, `rds_footer_menu` and
 * their `_locales` and `_v` versions); the old per-locale
 * `rds_*_custom_menu` tables stay until the destructive migration.
 */
export const customMenuField = (location: 'header' | 'footer'): ArrayField => ({
  name: 'customMenu',
  type: 'array',
  dbName: `rds_${location}_menu`,
  labels: {
    singular: 'Menu Item',
    plural: 'Menu Items',
  },
  admin: {
    description:
      'The same links are shown in every language. Only the name is translated; a blank translation shows the English name.',
  },
  access: {
    create: superAdminOrSupportOrTenantAccess,
    update: superAdminOrSupportOrTenantAccess,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      validate: validateMenuItemName,
    },
    ...generateUrlFields('href'),
  ],
});
