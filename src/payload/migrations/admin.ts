import { Payload } from 'payload';

import { User } from '@/payload/payload-types';

import { AdminUserData } from './types';
import { upsert } from './upsert';
import { createLogger } from '@/lib/logger';

const log = createLogger('seed');

function createAdminUser(): AdminUserData {
  return {
    email: 'admin@c211.io',
    password: 'admin',
    roles: ['super-admin'],
  };
}

export async function addLocalAdmin(payload: Payload): Promise<User> {
  log.info('Processing local admin user');

  const adminData = createAdminUser();

  return upsert(
    payload,
    'users',
    { email: { equals: adminData.email } },
    adminData,
  );
}
