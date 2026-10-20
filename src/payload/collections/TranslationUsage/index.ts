import type { CollectionConfig } from 'payload';

import { superAdminOrSupportAccess } from '../Users/access/roles';

/**
 * Monthly machine-translation usage per tenant and user (printable
 * directory auto-translation). Written only by server code, with an atomic
 * upsert; see docs/translation-usage.md. Shown in the Printable Directories
 * tab of a Resource Directory, not in the nav.
 */
export const TranslationUsage: CollectionConfig = {
  slug: 'translation-usage',
  access: {
    create: () => false,
    read: superAdminOrSupportAccess,
    update: () => false,
    delete: () => false,
  },
  admin: {
    hidden: true,
  },
  labels: {
    singular: 'Translation Usage',
    plural: 'Translation Usage',
  },
  indexes: [{ fields: ['tenantId', 'month', 'userEmail'], unique: true }],
  fields: [
    { name: 'tenantId', type: 'text', required: true, index: true },
    {
      name: 'month',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'YYYY-MM (UTC)' },
    },
    { name: 'userEmail', type: 'email', required: true },
    {
      name: 'billedCharacters',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description:
          'Characters sent to the translation provider (cache misses × target languages).',
      },
    },
    {
      name: 'requestedCharacters',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Billed characters plus cache hits.' },
    },
    {
      name: 'translationRuns',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Saves that machine-translated something.' },
    },
    {
      name: 'largestFieldCharacters',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    { name: 'locales', type: 'json' },
    { name: 'lastUsedAt', type: 'date', required: true },
  ],
};
