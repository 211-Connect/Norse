import pkg from './next-i18next.config.js';
const {
  i18n: { localePath: _, ...rest },
} = pkg;

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: rest,
};

export default nextConfig;
