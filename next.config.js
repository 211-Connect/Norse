import { withPayload } from '@payloadcms/next/withPayload';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '*',
        pathname: '/api/tenant-media/file/**',
      },
      {
        hostname: '*',
        pathname: '/**/api/tenant-media/file/**',
      },
      {
        hostname: 'cdn.c211.io',
      },
    ],
  },
};

export default withPayload(nextConfig);
