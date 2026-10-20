import { Tab } from 'payload';

import { DEFAULT_TRANSLATION_USAGE_LIMITS as defaultLimits } from '@/app/(app)/shared/services/translation-usage/translation-usage-limits';

import {
  superAdminOrSupportAccess,
  superAdminOrSupportOrTenantAccess,
} from '../../Users/access/roles';

/**
 * Capability keys gatable per Printable Directory User Group. See
 * docs/printable-directories.md and docs/adr/0001-printable-directory-authz-boundary.md.
 * `scheduledPdfDelivery`: docs/scheduled-pdf-delivery.md.
 */
export const PRINTABLE_DIRECTORY_CAPABILITIES = [
  { label: 'Logo Upload', value: 'logoUpload' },
  { label: 'Cover Customization', value: 'coverCustomization' },
  { label: 'Custom Headers & Footers', value: 'customHeadersFooters' },
  { label: 'Automatic Translation', value: 'automaticTranslation' },
  { label: 'Scheduled PDF Delivery', value: 'scheduledPdfDelivery' },
] as const;

export const printableDirectories: Tab = {
  name: 'printableDirectories',
  label: 'Printable Directories',
  fields: [
    {
      name: 'accessMode',
      type: 'select',
      dbName: 'pd_access_mode',
      label: 'Basic Access',
      defaultValue: 'allowlist',
      options: [
        { label: 'Everyone', value: 'everyone' },
        { label: 'Restricted Allow-list', value: 'allowlist' },
      ],
      admin: {
        condition: (data) =>
          Boolean(data?.featureFlags?.enablePrintableDirectories),
        description:
          'Everyone: every signed-in user of this tenant can use the basic feature. Restricted Allow-list: only the emails/domains below can use it at all.',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      name: 'allowedEmails',
      type: 'array',
      dbName: 'pd_allow_emails',
      label: 'Allowed Emails',
      admin: {
        condition: (data, siblingData) =>
          Boolean(data?.featureFlags?.enablePrintableDirectories) &&
          siblingData?.accessMode === 'allowlist',
      },
      labels: {
        singular: 'Email',
        plural: 'Allowed Emails',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'allowedDomains',
      type: 'array',
      dbName: 'pd_allow_domains',
      label: 'Allowed Domains',
      admin: {
        condition: (data, siblingData) =>
          Boolean(data?.featureFlags?.enablePrintableDirectories) &&
          siblingData?.accessMode === 'allowlist',
      },
      labels: {
        singular: 'Domain',
        plural: 'Allowed Domains',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'userGroups',
      type: 'array',
      dbName: 'pd_user_groups',
      label: 'User Groups',
      admin: {
        condition: (data) =>
          Boolean(data?.featureFlags?.enablePrintableDirectories),
        description:
          "Grant specific premium capabilities to users matched by email or domain. A user's effective capabilities are the union of every group they match.",
      },
      labels: {
        singular: 'User Group',
        plural: 'User Groups',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'emails',
          type: 'array',
          dbName: 'pd_group_emails',
          labels: {
            singular: 'Email',
            plural: 'Emails',
          },
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
          ],
        },
        {
          name: 'domains',
          type: 'array',
          dbName: 'pd_group_domains',
          labels: {
            singular: 'Domain',
            plural: 'Domains',
          },
          fields: [
            {
              name: 'domain',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'capabilities',
          type: 'select',
          hasMany: true,
          options: PRINTABLE_DIRECTORY_CAPABILITIES.map(({ label, value }) => ({
            label,
            value,
          })),
        },
      ],
    },
    {
      name: 'translation',
      type: 'group',
      label: 'Automatic Translation Limits',
      admin: {
        condition: (data) =>
          Boolean(data?.featureFlags?.enablePrintableDirectories),
        description:
          'Monthly machine-translation limits, in estimated USD at list price. Leave empty to use the global default (shown as placeholder). When a limit is reached, saves still succeed but are not machine-translated until next month (UTC).',
      },
      access: {
        read: superAdminOrSupportAccess,
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
      // Keep names short: Postgres truncates identifiers over 63 characters,
      // and the versions table prefixes `version_printable_directories_translation_`.
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'alertThresholdUsd',
              type: 'number',
              label: 'Alert threshold (USD / month)',
              min: 0,
              admin: {
                placeholder: String(defaultLimits.alertThresholdUsd),
                description:
                  'Emails all super-admins and support once per month when the tenant total reaches this.',
              },
            },
            {
              name: 'userQuotaUsd',
              type: 'number',
              label: 'Per-user quota (USD / month)',
              min: 0,
              admin: {
                placeholder: String(defaultLimits.userQuotaUsd),
              },
            },
            {
              name: 'tenantCapUsd',
              type: 'number',
              label: 'Tenant hard cap (USD / month)',
              min: 0,
              admin: {
                placeholder: String(defaultLimits.tenantCapUsd),
              },
            },
          ],
        },
      ],
    },
    {
      name: 'translationUsage',
      type: 'ui',
      admin: {
        condition: (data) =>
          Boolean(data?.featureFlags?.enablePrintableDirectories),
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/TranslationUsageTable',
        },
      },
    },
  ],
};
