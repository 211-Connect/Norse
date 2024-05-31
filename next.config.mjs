import bundleAnalyzer from '@next/bundle-analyzer';
import pkg from './next-i18next.config.js';
const {
  i18n: { localePath: _, ...rest },
} = pkg;

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: rest,
  transpilePackages: ['lucide-react'],
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
