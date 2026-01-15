import { withPayload } from '@payloadcms/next/withPayload';

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  basePath: process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || undefined,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
    unoptimized: true,
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
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
};

export default withPayload(nextConfig);
