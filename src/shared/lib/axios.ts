import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { parseCookies } from 'nookies';

function createAxiosWithAuth(ctx) {
  const axiosWithAuth = axios.create();
  axiosWithAuth.interceptors.request.use(
    async (config) => {
      if (!config.headers['Authorization']) {
        const session = ctx ? await getSession({ ctx }) : await getSession();

        if (session?.error && session.error === 'RefreshAccessTokenError') {
          await signOut();
        }

        config.headers['Authorization'] = `Bearer ${session?.user.accessToken}`;
      }

      if (!config.headers['x-session-id']) {
        const cookies = ctx ? parseCookies() : parseCookies(ctx);
        config.headers['x-session-id'] = cookies['session-id'];
      }

      config.params = config.params || {};

      return config;
    },
    (error) => Promise.reject(error),
  );
  return axiosWithAuth;
}

export { createAxiosWithAuth };
