import type { User } from '@/payload/payload-types';
import type { Access, Where } from 'payload';
import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities';
import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';
import { getCollectionIDType } from '@/payload/utilities/getCollectionIDType';

import { isSuperAdmin } from './isSuperAdmin';
import { isAccessingSelf } from './isAccessingSelf';

export const readAccess: Access<User> = ({ req, id }) => {
  if (!req?.user) {
    return false;
  }

  if (isAccessingSelf({ id, user: req.user })) {
    return true;
  }

  const superAdmin = isSuperAdmin(req.user);
  const selectedTenant = getTenantFromCookie(
    req.headers,
    getCollectionIDType({ payload: req.payload, collectionSlug: 'tenants' }),
  );
  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin');

  if (selectedTenant) {
    // If it's a super admin, or they have access to the tenant ID set in cookie
    const hasTenantAccess = adminTenantAccessIDs.some(
      (id) => id === selectedTenant,
    );
    if (superAdmin || hasTenantAccess) {
      return {
        'tenants.tenant': {
          equals: selectedTenant,
        },
      };
    }
  }

  if (superAdmin) {
    return true;
  }

  return {
    or: [
      {
        id: {
          equals: req.user.id,
        },
      },
      {
        'tenants.tenant': {
          in: adminTenantAccessIDs,
        },
      },
    ],
  } as Where;
};
