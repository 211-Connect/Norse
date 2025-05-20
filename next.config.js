const createNextIntlPlugin = require('next-intl/plugin');

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
};

const withNextIntl = createNextIntlPlugin();
module.exports = withNextIntl(nextConfig);
