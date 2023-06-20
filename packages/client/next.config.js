//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const fs = require('fs-extra');
const { i18n } = require('./next-i18next.config');
const getAppTheme = require('./webpack/getAppTheme');
const validateEnvironmentVariables = require('./webpack/validateEnvironmentVariables');

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
    locales: i18n.locales,
    defaultLocale: i18n.defaultLocale,
  },
  webpack: (config, { isServer, dir, config: nextConfig }) => {
    if (!isServer) {
      validateEnvironmentVariables();

      // Build the application theme file
      // Seperate larger parts of the config in to individual files
      const appConfigExists = fs.existsSync(`${dir}/app.json`);
      const fileName = appConfigExists ? 'app.json' : 'app.defaults.json';

      // Read the app config file and create a theme file
      const appConfig = fs.readJSONSync(`${dir}/${fileName}`);
      const appTheme = appConfig.theme;
      const appThemeFile = `${dir}/.norse/theme.json`;
      const theme = getAppTheme(appTheme);
      try {
        fs.writeJSONSync(appThemeFile, theme);
        fs.writeJSONSync(`${dir}/.norse/categories.json`, appConfig.categories);
        fs.writeJSONSync(
          `${dir}/.norse/suggestions.json`,
          appConfig.suggestions
        );
      } catch (err) {
        process.exit(1);
      }

      if (
        'nextConfig' in appConfig &&
        Object.keys(appConfig.nextConfig).length > 0
      ) {
        nextConfig = {
          ...nextConfig,
          ...appConfig.nextConfig,
        };
      }
    }

    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
