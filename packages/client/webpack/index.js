const createAppFromStrapi = require('./createAppFromStrapi');
const getAppTheme = require('./getAppTheme');
const fs = require('fs-extra');

/**
 *
 * @param {*} param1
 * @param {import('next/dist/server/config-shared').WebpackConfigContext} param2
 * @returns {import('next/dist/server/config-shared').NextJsWebpackConfig}
 */
module.exports = function webpackConfig(
  config,
  { isServer, dir, config: nextConfig }
) {
  if (!isServer) {
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

    if (_nextConfig && Object.keys(_nextConfig).length > 0) {
      nextConfig.images.domains = _nextConfig?.images?.domains ?? null;
    }
  }

  return config;
};
