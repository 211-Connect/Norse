import axios from 'axios';
import { getSession } from 'next-auth/react';
import { parseCookies } from 'nookies';
import router from 'next/router';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;

const axiosAuth = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosAuth.interceptors.request.use(
  async (config) => {
    if (!config.headers['Authorization']) {
      const session = await getSession();
      config.headers['Authorization'] = `Bearer ${session?.user.accessToken}`;
    }

    if (!config.headers['x-session-id']) {
      const cookies = parseCookies();
      config.headers['x-session-id'] = cookies['session-id'];
    }

    config.params = config.params || {};
    config.params['tenant_id'] = TENANT_ID;
    config.params['locale'] = router.locale;

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;
