const CopyWebpackPlugin = require('copy-webpack-plugin');
const utils = require('./bin/utils.js');

const appConfig = utils.getAppConfig();

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...(appConfig?.nextConfig ?? {}),
  webpack: (config, context) => {
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          { from: 'next-i18next.config.js', to: '../next-i18next.config.js' },
        ],
      })
    );
    return config;
  },
};

module.exports = nextConfig;
