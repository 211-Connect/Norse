import bundleAnalyzer from '@next/bundle-analyzer';
import pkg from './next-i18next.config.js';
const {
  i18n: { localePath: _, ...rest },
} = pkg;

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: rest,
  publicRuntimeConfig: {
    NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY,
    NEXT_PUBLIC_GTM_CONTAINER_ID: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
    NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    NEXT_PUBLIC_HELLO_WORLD: process.env.NEXT_PUBLIC_HELLO_WORLD,
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
