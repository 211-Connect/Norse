import type { User } from '@/payload/payload-types';
import type { Access, Where } from 'payload';
import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities';
import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';
import { getCollectionIDType } from '@/payload/utilities/getCollectionIDType';

import { isAccessingSelf } from './isAccessingSelf';
import { isSuperAdmin, isSupport } from './roles';

export const readAccess: Access<User> = ({ req, id }) => {
  if (!req?.user) {
    return false;
  }

  if (isAccessingSelf({ id, user: req.user })) {
    return true;
  }

  const superAdmin = isSuperAdmin(req.user);
  const isSupportAccount = isSupport(req.user);

  if (superAdmin || isSupportAccount) {
    return true;
  }

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
    if (hasTenantAccess) {
      return {
        'tenants.tenant': {
          equals: selectedTenant,
        },
      };
    }
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
