const createNextIntlPlugin = require('next-intl/plugin');

const { REMOTE_PATTERNS } = process.env;

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...(REMOTE_PATTERNS
    ? {
        images: {
          remotePatterns: [new URL(REMOTE_PATTERNS)],
        },
      }
    : {}),
};

const withNextIntl = createNextIntlPlugin();
module.exports = withNextIntl(nextConfig);
