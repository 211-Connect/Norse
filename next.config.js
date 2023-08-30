const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    defaultLocale: i18n.defaultLocale,
    locales: i18n.locales,
  },
};

module.exports = nextConfig;
