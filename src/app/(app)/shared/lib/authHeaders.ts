import { cookies } from 'next/headers';
import { signOut } from 'next-auth/react';
import { SESSION_ID } from './constants';
import { getSession } from '../utils/getServerSession';

export async function getAuthHeaders(tenantId?: string): Promise<HeadersInit> {
  const session = await getSession();
  if (session?.error && session.error === 'RefreshAccessTokenError') {
    await signOut();
  }

  const cookieList = await cookies();
  const sessionId = cookieList.get(SESSION_ID)?.value;

  const headers: HeadersInit = {};

  if (session?.user?.accessToken) {
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
  }

  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return headers;
}
