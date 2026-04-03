import type { CollectionConfig } from 'payload';
import { defaultLocale, locales } from '@/payload/i18n/locales';

import { updateAndDeleteAccess } from './access/updateAndDelete';
import { hasResourceDirectory } from './validators/hasResourceDirectory';
import { revalidateCache } from './hooks/revalidateCache';
import { pushRealmIdToCache } from './hooks/pushRealmIdToCache';
import {
  superAdminAccess,
  superAdminOrSupportAccess,
} from '../Users/access/roles';
import { removeRelatedResources } from './hooks/removeRelatedResources';
import { invalidateApiCache } from '../ResourceDirectories/hooks/invalidateApiCache';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  defaultSort: 'name',
  labels: {
    singular: 'Site',
    plural: 'Sites',
  },
  access: {
    create: superAdminAccess,
    delete: updateAndDeleteAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [revalidateCache, pushRealmIdToCache, invalidateApiCache],
    beforeDelete: [removeRelatedResources],
    afterDelete: [revalidateCache],
  },
  fields: [
    {
      type: 'ui',
      name: 'tenantActions',
      admin: {
        position: 'above',
        components: {
          Field: '@/payload/collections/Tenants/components/TenantActions',
        },
        disableListColumn: true,
      },
    },
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      access: {
        update: superAdminAccess,
        create: superAdminAccess,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      access: {
        update: superAdminOrSupportAccess,
        create: superAdminOrSupportAccess,
      },
    },
    {
      name: 'trustedDomains',
      type: 'array',
      required: false,
      defaultValue: [],
      access: {
        update: superAdminAccess,
        create: superAdminAccess,
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
      type: 'row',
      fields: [
        {
          // Don't use `locales` here, it breaks Drizzle relation
          name: 'enabledLocales',
          type: 'select',
          required: true,
          hasMany: true,
          defaultValue: defaultLocale,
          options: locales,
          access: {
            update: superAdminAccess,
            create: superAdminAccess,
          },
        },
        {
          name: 'defaultLocale',
          type: 'select',
          required: true,
          defaultValue: defaultLocale,
          options: locales,
          access: {
            update: superAdminAccess,
            create: superAdminAccess,
          },
        },
      ],
    },
    {
      name: 'services',
      label: 'Services',
      type: 'group',
      required: true,
      admin: {
        components: {
          Cell: '@/payload/collections/Tenants/components/ServicesCell',
        },
      },
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'resourceDirectory',
              label: 'Resource Directory',
              type: 'checkbox',
              defaultValue: false,
              validate: hasResourceDirectory,
            },
          ],
        },
      ],
    },
    {
      name: 'auth',
      type: 'group',
      access: {
        create: superAdminAccess,
        read: superAdminAccess,
        update: superAdminAccess,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'realmId',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'keycloakSecret',
              type: 'text',
            },
            {
              name: 'keycloakIssuer',
              type: 'text',
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'nextAuthSecret',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'common',
      type: 'group',
      label: 'Common Settings',
      access: {
        create: superAdminOrSupportAccess,
        read: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
      fields: [
        {
          name: 'gtmContainerId',
          type: 'text',
        },
        {
          name: 'matomoContainerUrl',
          type: 'text',
        },
        {
          name: 'umamiWebsiteId',
          type: 'text',
        },
      ],
    },
    {
      name: 'sms',
      type: 'group',
      label: 'SMS Settings',
      access: {
        create: superAdminOrSupportAccess,
        update: superAdminOrSupportAccess,
      },
      fields: [
        {
          name: 'smsProvider',
          type: 'select',
          label: 'SMS Provider',
          options: ['Twilio', 'EMS'],
          defaultValue: 'Twilio',
        },
        {
          name: 'twilio',
          type: 'group',
          label: 'Twilio Settings',
          admin: {
            condition: (data, siblingData) =>
              siblingData?.smsProvider === 'Twilio',
          },
          fields: [
            {
              name: 'phoneNumber',
              type: 'text',
            },
            {
              name: 'apiKey',
              type: 'text',
            },
            {
              name: 'apiKeySid',
              type: 'text',
            },
            {
              name: 'accountSid',
              type: 'text',
            },
          ],
        },
        {
          name: 'ems',
          type: 'group',
          label: 'EMS Settings',
          admin: {
            condition: (data, siblingData) =>
              siblingData?.smsProvider === 'EMS',
          },
          fields: [
            {
              name: 'apiKey',
              type: 'text',
            },
            {
              name: 'shortCode',
              type: 'text',
            },
            {
              name: 'keyword',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
};
