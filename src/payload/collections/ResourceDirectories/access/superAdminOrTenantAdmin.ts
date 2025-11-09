import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';
import { Access } from 'payload';
import { isSuperAdmin } from '../../Users/access/roles';

/**
 * Tenant admins and super admins can will be allowed access
 */
export const superAdminOrTenantAdminAccess: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req.user)) {
    return true;
  }

  // TODO: Verify
  const requestedTenant = req?.data?.tenant;
  if (!requestedTenant) {
    return true;
  }

  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin');

  return requestedTenant && adminTenantAccessIDs.includes(requestedTenant);
};
