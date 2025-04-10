import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig = {};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
