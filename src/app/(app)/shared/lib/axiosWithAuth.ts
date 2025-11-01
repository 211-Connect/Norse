import axios from 'axios';
import { signOut } from 'next-auth/react';
import { cookies } from 'next/headers';
import { SESSION_ID } from './constants';
import { getSession } from '../utils/getServerSession';

interface AxiosWithAuthProps {
  tenantId?: string;
}

function createAxiosWithAuth({ tenantId }: AxiosWithAuthProps) {
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
        const session = await getSession();
        if (session?.error && session.error === 'RefreshAccessTokenError') {
          await signOut();
        }

        if (session?.user?.accessToken) {
          config.headers['Authorization'] =
            `Bearer ${session?.user.accessToken}`;
        }
      }

      const cookieList = await cookies();
      const sessionId = cookieList.get(SESSION_ID)?.value;

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
