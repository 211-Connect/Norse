import { Access, FieldAccess, PayloadRequest } from 'payload';
import { isTenant } from './roles';
import { getUserTenantIDs } from '@/payload/utilities/getUserTenantIDs';
import { User } from '@/payload/payload-types';

/* TENANT ADMIN */
export const isTenantAdmin = (user: User | null): boolean => {
  if (!isTenant(user)) {
    return false;
  }

  return user?.tenants?.some((t) => t.roles.includes('tenant-admin')) ?? false;
};

export const isTenantAdminAccess: Access = ({ req }): boolean => {
  if (!isTenant(req.user)) {
    return false;
  }

  const requestedTenant = req?.data?.tenant;
  if (!requestedTenant) {
    return true;
  }

  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin');
  return adminTenantAccessIDs.includes(requestedTenant);
};
export const isTenantAdminFieldAccess: FieldAccess = ({ req }): boolean => {
  if (!isTenant(req.user)) {
    return false;
  }

  const requestedTenant = req?.data?.tenant;
  if (!requestedTenant) {
    return true;
  }

  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin');
  return adminTenantAccessIDs.includes(requestedTenant);
};

/* TENANT EDITOR */
export const isTenantEditorAccess: Access = ({ req }): boolean => {
  if (!isTenant(req.user)) {
    return false;
  }

  const requestedTenant = req?.data?.tenant;
  if (!requestedTenant) {
    return true;
  }

  const editorTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-editor');
  return editorTenantAccessIDs.includes(requestedTenant);
};
export const isTenantEditorFieldAccess: FieldAccess = ({ req }): boolean => {
  if (!isTenant(req.user)) {
    return false;
  }

  const requestedTenant = req?.data?.tenant;
  if (!requestedTenant) {
    return true;
  }

  const editorTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-editor');
  return editorTenantAccessIDs.includes(requestedTenant);
};
