import type { Access, FieldAccess, FieldBase } from 'payload';
import { User } from '@/payload/payload-types';

/* SUPER ADMIN */

export const isSuperAdmin = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('super-admin'));
};

export const isSuperAdminAccess: Access = ({ req }): boolean => {
  return isSuperAdmin(req.user);
};

export const isSuperAdminFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdmin(req.user);
};

/* SUPPORT */
export const isSupport = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('support'));
};

export const isSupportAccess: Access = ({ req }): boolean => {
  return isSupport(req.user);
};

export const isSupportFieldAccess: FieldAccess = ({ req }) => {
  return isSupport(req.user);
};

/* TENANT */
export const isTenant = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('tenant'));
};

export const isTenantAccess: Access = ({ req }): boolean => {
  return isTenant(req.user);
};

export const isTenantFieldAccess: FieldAccess = ({ req }) => {
  return isTenant(req.user);
};
