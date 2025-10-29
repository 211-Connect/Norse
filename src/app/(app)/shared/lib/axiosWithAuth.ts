import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { getSession as getSessionServer } from '@/auth';
import { isServer } from './isServer';

function createAxiosWithAuth({
  sessionId,
  tenantId,
}: { sessionId?: string; tenantId?: string } = {}) {
  const axiosWithAuth = axios.create({
    params: {
      tenant_id: tenantId,
    },
    headers: {
      'x-tenant-id': tenantId,
    },
  });
  axiosWithAuth.interceptors.request.use(
    async (config) => {
      if (!config.headers['Authorization']) {
        let session: Session | null = null;

        if (isServer()) {
          session = await getSessionServer();
        } else {
          session = await getSession();
        }

        if (session?.error && session.error === 'RefreshAccessTokenError') {
          await signOut();
        }

        config.headers['Authorization'] = `Bearer ${session?.user.accessToken}`;
      }

      if (!config.headers['x-session-id'] && sessionId) {
        config.headers['x-session-id'] = sessionId;
      }

      config.params = config.params || {};

      return config;
    },
    (error) => Promise.reject(error),
  );
  return axiosWithAuth;
}

export { createAxiosWithAuth };
