'use server';

import { COOKIE_TENANT_ID, IS_DEVELOPMENT } from '@/lib/constants';
import { cookies } from 'next/headers';

export async function setTenant(tenantId: string) {
  if (!IS_DEVELOPMENT) {
    throw new Error('Can only update tenantId in development');
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_TENANT_ID, tenantId, {
    path: '/',
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  });
}
