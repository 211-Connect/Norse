import { headers } from 'next/headers';
import { cache } from 'react';

export const getHost = cache(async () => {
  const headerList = await headers();

  const host = headerList.get('host')?.split(':')[0] || 'localhost';
  const protocol = headerList.get('x-forwarded-proto') || 'http';
  return { host, protocol };
});
