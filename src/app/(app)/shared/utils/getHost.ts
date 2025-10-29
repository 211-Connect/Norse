import { headers } from 'next/headers';
import { cache } from 'react';

export const getHost = cache(async () => {
  const headerList = await headers();

  const host = headerList.get('host')?.split(':')[0] || 'localhost';
  return { host };
});

export const parseHost = (host: string): string => {
  return process.env.NODE_ENV === 'development'
    ? host.split('.localhost')[0]
    : host;
};
