import { withPayload } from '@payloadcms/next/withPayload';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  basePath: process.env.CUSTOM_BASE_PATH || undefined,
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        hostname: '*',
        pathname: '/api/tenant-media/file/**',
      },
      {
        hostname: 'cdn.c211.io',
      },
    ],
  },
  trailingSlash: process.env.WITH_TRAILING_SLASHES === 'true',
  skipTrailingSlashRedirect: true,
};

export default withPayload(nextConfig);
