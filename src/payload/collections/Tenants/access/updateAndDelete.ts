import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';
import { Access } from 'payload';

import { isSuperAdmin, isSupport } from '../../Users/access/roles';

/**
 * Both tenant admins and editors can modify tenant settings
 */
export const updateAndDeleteAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req.user) || isSupport(req.user)) {
    return true;
  }

  return {
    id: {
      in: getUserTenantIDs(req.user),
    },
  };
};
