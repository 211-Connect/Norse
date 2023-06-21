const createAppFromStrapi = require('./createAppFromStrapi');
const getAppTheme = require('./getAppTheme');
const fs = require('fs-extra');

/**
 *
 * @param {import('next').NextConfig} config
 * @returns
 */
module.exports = function withNorseConfig(config) {
  const dir = process.cwd();

  fs.mkdirSync(`${dir}/.norse`, { recursive: true });

  createAppFromStrapi(dir);

  // Build the application theme file
  // Seperate larger parts of the config in to individual files
  let fileName = 'app.defaults.json';
  let filePath = `${dir}/${fileName}`;
  const tmpAppConfigExists = fs.existsSync(`${dir}/tmp/app.json`);
  if (tmpAppConfigExists) {
    fileName = 'app.json';
    filePath = `${dir}/tmp/${fileName}`;
  } else if (fs.existsSync(`${dir}/app.json`)) {
    fileName = 'app.json';
    filePath = `${dir}/${fileName}`;
  }

  // Read the app config file and create a theme file
  const appConfig = fs.readJSONSync(filePath);
  const appThemeFile = `${dir}/.norse/theme.json`;
  const {
    theme: appTheme,
    categories,
    suggestions,
    nextConfig: _nextConfig,
    ...rest
  } = appConfig;
  const theme = getAppTheme(appTheme);

  try {
    fs.writeJSONSync(appThemeFile, theme);
    fs.writeJSONSync(`${dir}/.norse/categories.json`, categories);
    fs.writeJSONSync(`${dir}/.norse/suggestions.json`, suggestions);
    fs.writeJSONSync(`${dir}/.norse/config.json`, rest);
  } catch (err) {
    process.exit(1);
  }

  if (appConfig.nextConfig && Object.keys(appConfig.nextConfig).length > 0) {
    config.images = {
      ...config.images,
      domains: appConfig?.nextConfig?.images?.domains ?? null,
    };
  }

  config.i18n = {
    defaultLocale: appConfig?.i18n?.defaultLocale ?? 'en',
    locales: appConfig?.i18n?.locales ?? ['en'],
  };

  return config;
};
