import { withPayload } from '@payloadcms/next/withPayload';

const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

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
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction
              ? `public, max-age=${ONE_DAY}, s-maxage=${7 * ONE_DAY}, stale-while-revalidate=${ONE_DAY}`
              : 'no-cache',
          },
        ],
      },
      {
        source: '/locales/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction
              ? `public, max-age=${ONE_HOUR}, s-maxage=${6 * ONE_HOUR}, stale-while-revalidate=${ONE_DAY}`
              : 'no-cache',
          },
        ],
      },
    ];
  },
  basePath: process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || undefined,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
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
  cacheMaxMemorySize: 32 * 1024 * 1024, // 32 MB
  // Memory optimization settings
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    preloadEntriesOnStart: false,
    // Lets client router cache serve Back/Forward from cache briefly instead
    // of always refetching dynamic routes; well under the search data's own
    // 1-hour cache TTL, so it can't surface staler results than a fresh hit.
    staleTimes: { dynamic: 30 },
  },
  // Do not bundle pino/pino-pretty for server — use native require() at
  // runtime. This avoids pino.transport() worker threads resolving paths
  // inside the .next/server/vendor-chunks/ directory.
  serverExternalPackages: ['pino', 'pino-pretty'],
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack cache for production
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: 'memory',
        maxGenerations: 1, // Limit cache memory usage
      });
    }

    // Suppress Payload CMS dynamic import warnings
    config.module = config.module || {};
    config.module.unknownContextCritical = false;
    config.module.exprContextCritical = false;

    // pino-pretty → pino-abstract-transport → worker_threads (Node.js built-in).
    // Aliasing to false replaces it with an empty module in the browser bundle,
    // preventing the "Can't resolve 'worker_threads'" error in client components
    // that import from src/lib/logger.ts.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino-pretty': false,
        ioredis: false,
      };
    }

    return config;
  },
};

export default withPayload(nextConfig);
