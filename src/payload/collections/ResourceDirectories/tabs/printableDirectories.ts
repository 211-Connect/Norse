import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

/**
 * Capability keys gatable per Printable Directory User Group. See
 * docs/printable-directories.md and docs/adr/0001-printable-directory-authz-boundary.md.
 * `scheduledPdfDelivery` is a reserved placeholder: no feature exists behind
 * it yet.
 */
export const PRINTABLE_DIRECTORY_CAPABILITIES = [
  { label: 'Logo Upload', value: 'logoUpload' },
  { label: 'Cover Customization', value: 'coverCustomization' },
  { label: 'Custom Headers & Footers', value: 'customHeadersFooters' },
  { label: 'Automatic Translation', value: 'automaticTranslation' },
  {
    label: 'Scheduled PDF Delivery (not available yet)',
    value: 'scheduledPdfDelivery',
  },
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
  ],
};
