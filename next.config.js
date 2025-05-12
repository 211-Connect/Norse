const createNextIntlPlugin = require('next-intl/plugin');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  images: {
    remotePatterns: [new URL('https://cdn.c211.io/**')],
  },
};

const withNextIntl = createNextIntlPlugin();
module.exports = withNextIntl(nextConfig);
