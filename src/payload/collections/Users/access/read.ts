import type { User } from '@/payload/payload-types';
import { getCollectionIDType } from '@/payload/utilities/getCollectionIDType';
import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';
import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities';
import type { Access, Where } from 'payload';

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

  // Only tenant admins can view other users in their tenant
  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin');

  if (selectedTenant) {
    const hasTenantAccess = adminTenantAccessIDs.includes(
      String(selectedTenant),
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
          in: adminTenantAccessIDs.map(String),
        },
      },
    ],
  } as Where;
};
