import axios, { RawAxiosRequestHeaders } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { parseCookies } from 'nookies';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;
const REALM_ID = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;

export function getServerSideAxios(
  ctx: GetServerSidePropsContext,
  session?: Session
) {
  const headers: RawAxiosRequestHeaders = {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
    'x-realm-id': REALM_ID,
  };

  if (session) {
    headers['Authorization'] = `Bearer ${session?.user.accessToken}`;
  }

  if (!headers['x-session-id']) {
    const cookies = parseCookies(ctx);
    headers['x-session-id'] = cookies['session-id'];
  }

  let axiosAuth = axios.create({
    baseURL: BASE_URL,
    headers,
  });

  return axiosAuth;
}
