import createNextIntlPlugin from 'next-intl/plugin';
import { withPayload } from '@payloadcms/next/withPayload';

const { REMOTE_PATTERNS } = process.env;

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  ...(REMOTE_PATTERNS
    ? {
        images: {
          remotePatterns: REMOTE_PATTERNS.split(',').map(
            (pattern) => new URL(pattern),
          ),
        },
      }
    : {}),
  experimental: {
    reactCompiler: false,
  },
};

const withNextIntl = createNextIntlPlugin();
export default withPayload(withNextIntl(nextConfig));
