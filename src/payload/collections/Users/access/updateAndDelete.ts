import type { Access } from 'payload';

import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';

import { isAccessingSelf } from './isAccessingSelf';
import { isSuperAdmin, isSupport } from './roles';

export const updateAndDeleteAccess: Access = ({ req, id, data }) => {
  const { user } = req;

  if (!user) {
    return false;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  if (data?.roles?.includes('super-admin')) {
    return false;
  }

  if (isSupport(user) || isAccessingSelf({ user, id })) {
    return true;
  }

  /**
   * Constrains update and delete access to users that belong
   * to the same tenant as the admin making the request
   *
   * You may want to take this a step further with a beforeChange
   * hook to ensure that the a admin can only remove users
   * from their own tenant in the tenants array.
   */
  return {
    'tenants.tenant': {
      in: getUserTenantIDs(user, 'tenant-admin'),
    },
  };
};
