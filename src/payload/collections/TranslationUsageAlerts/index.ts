import type { CollectionConfig } from 'payload';

import { superAdminOrSupportAccess } from '../Users/access/roles';

/**
 * One row per tenant and month whose machine-translation cost crossed the
 * alert threshold. The unique index makes the alert email go out once:
 * only the request whose insert succeeds sends it. See
 * docs/translation-usage.md.
 */
export const TranslationUsageAlerts: CollectionConfig = {
  slug: 'translation-usage-alerts',
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
    singular: 'Translation Usage Alert',
    plural: 'Translation Usage Alerts',
  },
  indexes: [{ fields: ['tenantId', 'month'], unique: true }],
  fields: [
    { name: 'tenantId', type: 'text', required: true },
    { name: 'month', type: 'text', required: true },
    {
      name: 'billedCharacters',
      type: 'number',
      required: true,
      admin: { description: 'Tenant total when the alert was sent.' },
    },
    { name: 'thresholdUsd', type: 'number', required: true },
  ],
};
