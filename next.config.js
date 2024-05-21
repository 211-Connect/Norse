//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { nextConfig: _nextConfig } = require('./next-i18next.config');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ..._nextConfig,
  webpack: (config, context) => {
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          { from: '.norse', to: '../.norse' },
          { from: 'next-i18next.config.js', to: '../next-i18next.config.js' },
        ],
      })
    );
    return config;
  },
};

module.exports = nextConfig;
