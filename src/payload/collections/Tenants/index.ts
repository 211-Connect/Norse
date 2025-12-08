import type { CollectionConfig } from 'payload';
import { defaultLocale, locales } from '@/payload/i18n/locales';

import { updateAndDeleteAccess } from './access/updateAndDelete';
import { hasResourceDirectory } from './validators/hasResourceDirectory';
import { revalidateCache } from './hooks/revalidateCache';
import {
  isSuperAdmin,
  isSuperAdminAccess,
  isSuperAdminFieldAccess,
  isSuperAdminOrSupportFieldAccess,
} from '../Users/access/roles';
import {
  hasFeatureFieldAccess,
  hasPropertySettingsFieldAccess,
} from '../Users/access/permissions';
import { removeRelatedResources } from './hooks/removeRelatedResources';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: {
    singular: 'Site',
    plural: 'Sites',
  },
  access: {
    create: isSuperAdminAccess,
    delete: updateAndDeleteAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [revalidateCache],
    beforeDelete: [removeRelatedResources],
    afterDelete: [revalidateCache],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      access: {
        update: isSuperAdminFieldAccess,
        create: isSuperAdminFieldAccess,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      access: {
        update: isSuperAdminOrSupportFieldAccess,
        create: isSuperAdminOrSupportFieldAccess,
      },
    },
    {
      name: 'trustedDomains',
      type: 'array',
      required: false,
      defaultValue: [],
      access: {
        update: hasPropertySettingsFieldAccess,
        create: hasPropertySettingsFieldAccess,
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
            update: hasPropertySettingsFieldAccess,
            create: hasPropertySettingsFieldAccess,
          },
        },
        {
          name: 'defaultLocale',
          type: 'select',
          required: true,
          defaultValue: defaultLocale,
          options: locales,
          access: {
            update: hasPropertySettingsFieldAccess,
            create: hasPropertySettingsFieldAccess,
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
        create: isSuperAdminOrSupportFieldAccess,
        update: isSuperAdminOrSupportFieldAccess,
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
        create: isSuperAdminFieldAccess,
        read: isSuperAdminFieldAccess,
        update: isSuperAdminFieldAccess,
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
        create: isSuperAdminOrSupportFieldAccess,
        read: isSuperAdminOrSupportFieldAccess,
        update: isSuperAdminOrSupportFieldAccess,
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
      ],
    },
    {
      name: 'twilio',
      type: 'group',
      label: 'Twilio Settings',
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
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
  ],
};
