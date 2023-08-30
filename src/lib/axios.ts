import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { parseCookies } from 'nookies';
import router from 'next/router';

const axiosAuth = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosAuth.interceptors.request.use(
  async (config) => {
    if (!config.headers['Authorization']) {
      const session = await getSession();

      if (session?.error && session.error === 'RefreshAccessTokenError') {
        await signOut();
      }

      config.headers['Authorization'] = `Bearer ${session?.user.accessToken}`;
    }

    if (!config.headers['x-session-id']) {
      const cookies = parseCookies();
      config.headers['x-session-id'] = cookies['session-id'];
    }

    config.params = config.params || {};
    config.params['locale'] = router.locale;

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;
