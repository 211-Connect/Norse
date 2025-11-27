import { withPayload } from '@payloadcms/next/withPayload';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || undefined,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
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
      {
        hostname: 'norse2-dev-media.sfo3.cdn.digitaloceanspaces.com',
      },
    ],
  },
  trailingSlash: process.env.WITH_TRAILING_SLASHES === 'true',
  skipTrailingSlashRedirect: true,
};

export default withPayload(nextConfig);
