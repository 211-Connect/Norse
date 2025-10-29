import type { Access, FieldAccess, FieldBase } from 'payload';
import { User } from '@/payload/payload-types';

export const isSuperAdminAccess: Access = ({ req }): boolean => {
  return isSuperAdmin(req.user);
};

export const isSuperAdminFieldAccess: FieldAccess = ({ req }) => {
  return isSuperAdmin(req.user);
};

export const superAdminEditFieldAccess: FieldBase['access'] = {
  create: isSuperAdminFieldAccess,
  update: isSuperAdminFieldAccess,
};

export const isSuperAdmin = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('super-admin'));
};
