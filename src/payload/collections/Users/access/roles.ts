import type { PayloadRequest } from 'payload';
import { User } from '@/payload/payload-types';

export const isSuperAdmin = (user: Pick<User, 'roles'> | null): boolean => {
  return Boolean(user?.roles?.includes('super-admin'));
};

export const superAdminAccess = ({ req }: { req: PayloadRequest }) =>
  isSuperAdmin(req.user);

export const isSupport = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('support'));
};

export const isTenant = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('tenant'));
};

export const superAdminOrSupportAccess = ({ req }: { req: PayloadRequest }) =>
  isSuperAdmin(req.user) || isSupport(req.user);

export const superAdminOrSupportOrTenantAccess = ({
  req,
}: {
  req: PayloadRequest;
}) => isSuperAdmin(req.user) || isSupport(req.user) || isTenant(req.user);
