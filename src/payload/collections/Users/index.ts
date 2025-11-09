import type { CollectionConfig } from 'payload';

import { createAccess } from './access/create';
import { readAccess } from './access/read';
import { updateAndDeleteAccess } from './access/updateAndDelete';
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';
import { isSuperAdmin, isSupport } from './access/roles';

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: createAccess,
    delete: updateAndDeleteAccess,
    read: readAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      admin: {
        position: 'sidebar',
      },
      name: 'roles',
      type: 'select',
      defaultValue: ['tenant'],
      hasMany: true,
      options: ['super-admin', 'support', 'tenant'],
      filterOptions: ({ options, req }) => {
        if (isSuperAdmin(req.user) || req.context?.migration) {
          return options;
        }

        if (isSupport(req.user)) {
          return options.filter((option) => option !== 'super-admin');
        }

        return options.filter((option) => option === 'tenant');
      },
      required: true,
      access: {
        update: ({ req, doc }) => {
          if (isSuperAdmin(req.user)) {
            return true;
          }

          if (isSupport(req.user) && !doc?.roles.includes('super-admin')) {
            return true;
          }

          return false;
        },
      },
    },
    {
      name: 'tenants',
      type: 'array',
      access: {
        update: ({ req }) => {
          return isSuperAdmin(req.user) || isSupport(req.user);
        },
      },
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          index: true,
          relationTo: 'tenants',
          required: true,
          saveToJWT: true,
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['tenant-editor'],
          hasMany: true,
          options: ['tenant-admin', 'tenant-editor'],
          required: true,
        },
      ],
      saveToJWT: true,
      required: true,
      admin: {
        condition: (_, siblingData) => {
          return siblingData.roles?.includes('tenant');
        },
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
};
