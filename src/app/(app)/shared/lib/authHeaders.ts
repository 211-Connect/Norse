import { cookies } from 'next/headers';
import { SESSION_ID } from './constants';
import { getSession } from '../utils/getServerSession';
import { createLogger } from '@/lib/logger';

const log = createLogger('authHeaders');

export async function getAuthHeaders(tenantId?: string): Promise<HeadersInit> {
  const session = await getSession();

  // If token refresh failed completely, session will have an error
  // We don't sign out here - let the client handle it
  if (session?.error === 'RefreshTokenExpired') {
    log.warn(
      'Session has expired refresh token; client should re-authenticate',
    );
  }

  const cookieList = await cookies();
  const sessionId = cookieList.get(SESSION_ID)?.value;

  const headers: HeadersInit = {};

  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return headers;
}
