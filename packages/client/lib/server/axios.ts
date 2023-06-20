import axios, { RawAxiosRequestHeaders } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { parseCookies } from 'nookies';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;

export function getServerSideAxios(
  ctx: GetServerSidePropsContext,
  session?: Session
) {
  const headers: RawAxiosRequestHeaders = {
    'Content-Type': 'application/json',
  };

  if (session) {
    headers['Authorization'] = `Bearer ${session?.user.accessToken}`;
  }

  if (!headers['x-session-id']) {
    const cookies = parseCookies(ctx);
    headers['x-session-id'] = cookies['session-id'];
  }

  const axiosAuth = axios.create({
    baseURL: BASE_URL,
    headers,
    params: {
      tenant_id: TENANT_ID,
      locale: ctx.locale,
    },
  });

  return axiosAuth;
}
