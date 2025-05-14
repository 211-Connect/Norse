import { cookies } from 'next/headers';
import { COOKIE_TENANT_ID } from '../constants';

export async function getTenantId() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get(COOKIE_TENANT_ID)?.value;
  return tenantId;
}
