import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { TENANT_ID } from './constants';
import { Session } from 'next-auth/core/types';
import { getSession as getSessionServer } from '@/auth';
import { isServer } from './isServer';

function createAxiosWithAuth({ sessionId }: { sessionId?: string } = {}) {
  const axiosWithAuth = axios.create({
    params: {
      tenant_id: TENANT_ID,
    },
    headers: {
      'x-tenant-id': TENANT_ID,
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
