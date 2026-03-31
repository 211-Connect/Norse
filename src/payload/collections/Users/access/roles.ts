import type { Access, FieldAccess, FieldBase } from 'payload';
import { User } from '@/payload/payload-types';

/* SUPER ADMIN */

export const isSuperAdmin = (user: Pick<User, 'roles'> | null): boolean => {
  return Boolean(user?.roles?.includes('super-admin'));
};

export const superAdminAccess: Access = ({ req }) => {
  return isSuperAdmin(req.user);
};

export const superAdminFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdmin(req.user);
};

/* SUPPORT */
export const isSupport = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('support'));
};

/* TENANT */
export const isTenant = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('tenant'));
};

/* COMBINED ROLES */
export const superAdminOrSupportAccess: Access = ({ req }) => {
  return isSuperAdmin(req.user) || isSupport(req.user);
};

export const superAdminOrSupportFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdmin(req.user) || isSupport(req.user);
};

export const superAdminOrSupportOrTenantAccess: Access = ({ req }) => {
  return isSuperAdmin(req.user) || isSupport(req.user) || isTenant(req.user);
};

export const superAdminOrSupportOrTenantFieldAccess: FieldAccess = ({
  req,
}) => {
  return isSuperAdmin(req.user) || isSupport(req.user) || isTenant(req.user);
};
