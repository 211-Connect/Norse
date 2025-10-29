import type { CollectionConfig } from 'payload';
import { defaultLocale, locales } from '@/payload/i18n/locales';

import { updateAndDeleteAccess } from './access/updateAndDelete';
import { hasResourceDirectory } from './validators/hasResourceDirectory';
import { revalidateCache } from './hooks/revalidateCache';
import { isSuperAdminAccess } from '../Users/access/isSuperAdmin';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: isSuperAdminAccess,
    delete: updateAndDeleteAccess,
    read: ({ req }) => Boolean(req.user),
    update: updateAndDeleteAccess,
  },
  versions: {
    drafts: false,
  },
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [revalidateCache],
    afterDelete: [revalidateCache],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'trustedDomains',
      type: 'array',
      required: true,
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
        },
        {
          name: 'defaultLocale',
          type: 'select',
          required: true,
          defaultValue: defaultLocale,
          options: locales,
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
            {
              name: 'hsda',
              label: 'HSDA',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'searchApi',
              label: 'Search API',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'auth',
      type: 'group',
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
      ],
    },
  ],
};
