import type { User } from '@/payload/payload-types';
import type { Access } from 'payload';

import { isSuperAdmin, isSupport } from './roles';

export const createAccess: Access<User> = ({ req }) => {
  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req.user)) {
    return true;
  }

  if (!isSuperAdmin(req.user) && req.data?.roles?.includes('super-admin')) {
    return false;
  }

  if (isSupport(req.user)) {
    return true;
  }

  return false;
};
