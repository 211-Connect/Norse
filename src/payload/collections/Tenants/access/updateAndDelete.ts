import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';

import { Access } from 'payload';
import { isSuperAdmin } from '../../Users/access/roles';

export const updateAndDeleteAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req.user)) {
    return true;
  }

  return {
    id: {
      in: getUserTenantIDs(req.user, 'tenant-admin'),
    },
  };
};
