import axios from 'axios';
import { getSession } from 'next-auth/react';
import { parseCookies } from 'nookies';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;
const REALM_ID = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;

const axiosAuth = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
    'x-realm-id': REALM_ID,
  },
});

axiosAuth.interceptors.request.use(
  async (config) => {
    if (!config.headers['Authorization']) {
      const session = await getSession();
      config.headers['Authorization'] = `Bearer ${session?.user?.accessToken}`;
    }

    if (!config.headers['x-session-id']) {
      const cookies = parseCookies();
      config.headers['x-session-id'] = cookies['session-id'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;
