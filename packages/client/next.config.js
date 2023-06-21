//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { nextConfig: _nextConfig } = require('./next-i18next.config');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ..._nextConfig,
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
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
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
