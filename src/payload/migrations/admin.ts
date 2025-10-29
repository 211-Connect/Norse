import { Payload } from 'payload';

import { User } from '@/payload/payload-types';

import { AdminUserData } from './types';
import { upsert } from './upsert';

function createAdminUser(): AdminUserData {
  return {
    email: 'admin@c211.io',
    password: 'admin',
    roles: ['super-admin'],
  };
}

export async function addLocalAdmin(payload: Payload): Promise<User> {
  console.log('Seed: Processing local admin user');

  const adminData = createAdminUser();

  return upsert(
    payload,
    'users',
    { email: { equals: adminData.email } },
    adminData,
  );
}
