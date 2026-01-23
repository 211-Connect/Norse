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
  output: 'standalone',
  trailingSlash: process.env.NEXT_PUBLIC_WITH_TRAILING_SLASHES === 'true',
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  cacheMaxMemorySize: 32 * 1024 * 1024, // 32 MB
  // Memory optimization settings
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    preloadEntriesOnStart: false,
  },
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },
  ) => {
    // Optimize webpack cache for production
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: 'memory',
        maxGenerations: 1, // Limit cache memory usage
      });
    }
    return config;
  },
};

export default withPayload(nextConfig);
