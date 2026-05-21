import type { CollectionConfig } from 'payload';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

import { createAccess } from './access/create';
import { readAccess } from './access/read';
import { isSuperAdmin, isSupport } from './access/roles';
import { updateAndDeleteAccess } from './access/updateAndDelete';
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';

function getHostFromHeader(rawHost?: string | null): string {
  if (!rawHost) {
    return '';
  }

  return rawHost
    .split(',')[0]
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

async function getTenantResetOrigin(req?: {
  headers?: Headers;
}): Promise<string | null> {
  const host =
    getHostFromHeader(process.env.CUSTOM_AUTH_HOST) ||
    getHostFromHeader(req?.headers?.get('x-forwarded-host')) ||
    getHostFromHeader(req?.headers?.get('host'));

  if (!host) {
    return null;
  }

  const tenant = await findTenantByHost(parseHost(host));
  if (!tenant) {
    return null;
  }

  const protocol =
    process.env.CUSTOM_AUTH_PROTOCOL ||
    req?.headers?.get('x-forwarded-proto') ||
    'https';

  return `${protocol}://${host}`;
}

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
  auth: {
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args) {
          return '<p>You are receiving this email because a password reset request was made for your account but unknown error occurred.</p><p>If you did not make this request, please ignore this email.</p>';
        }

        const { req, token, user } = args;
        const resetPath = withOptionalCustomBasePath(`/admin/reset/${token}`);
        const resetOrigin = await getTenantResetOrigin(req);
        const resetURL = resetOrigin
          ? new URL(resetPath, resetOrigin).toString()
          : resetPath;

        return `${user?.email ? `<p>Hello ${user.email},</p>` : ''}<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p><p>Please click on the following link, or paste this into your browser to complete the process:</p><p><a href="${resetURL}">${resetURL}</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;
      },
      generateEmailSubject: () => 'Reset Your Password',
    },
  },
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
        const firstUser = !req.user;
        if (isSuperAdmin(req.user) || req.context?.migration || firstUser) {
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
