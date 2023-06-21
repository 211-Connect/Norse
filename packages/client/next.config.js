//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs-extra');
const { i18n } = require('./next-i18next.config');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  i18n: {
    defaultLocale: i18n?.defaultLocale ?? 'en',
    locales: i18n?.locales ?? ['en'],
  },
  webpack: (config, context) => {
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          { from: '.norse', to: '../.norse' },
          { from: 'next-i18next.config.js', to: '../next-i18next.config.js' },
        ],
      })
    );

    const appConfig = fs.readJSONSync(`${process.cwd()}/.norse/config.json`);

    context.config.images = {
      ...context.config.images,
      domains: appConfig?.nextConfig?.images?.domains ?? null,
    };

    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
