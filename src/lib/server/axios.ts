import axios, { RawAxiosRequestHeaders } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { parseCookies } from 'nookies';

export function getServerSideAxios(
  ctx?: Partial<GetServerSidePropsContext>,
  session?: Session | null
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
    headers,
    params: {
      locale: ctx?.locale ? ctx.locale : 'en',
    },
  });

  return axiosAuth;
}
