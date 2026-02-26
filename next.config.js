import { withPayload } from '@payloadcms/next/withPayload';
import bundleAnalyzer from '@next/bundle-analyzer';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  // Explicitly prevent Webpack from parsing and bundling these massive
  // Node-only dependencies into chunks. This eliminates the chunk bloat.
  serverExternalPackages: [
    '@google-cloud/translate',
    '@azure-rest/ai-translation-text',
    '@grpc/grpc-js',
    'google-gax',
    'ioredis',
  ],
  experimental: {
    outputFileTracingRoot: __dirname,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    preloadEntriesOnStart: false,
  },
  // Do not bundle pino/pino-pretty for server — use native require() at
  // runtime. This avoids pino.transport() worker threads resolving paths
  // inside the .next/server/vendor-chunks/ directory.
  serverExternalPackages: ['pino', 'pino-pretty'],
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

    if (isServer) {
      const StatsPlugin = require('webpack').StatsPlugin;
      if (StatsPlugin) {
        config.plugins.push(
          new StatsPlugin('stats.json', { chunkModules: true })
        );
      }
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
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(withPayload(nextConfig));
