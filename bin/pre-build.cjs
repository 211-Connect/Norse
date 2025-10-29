const createAppFromStrapi = require('./createAppFromStrapi.cjs');
const getAppTheme = require('./getAppTheme.cjs');
const fs = require('fs-extra');

const dir = process.cwd();

(async () => {
  fs.mkdirSync(`${dir}/.norse`, { recursive: true });
  fs.mkdirSync(`${dir}/tmp`, { recursive: true });

  await createAppFromStrapi(dir);

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
  // const appThemeFile = `${dir}/.norse/theme.json`;
  const { categories, suggestions, ...rest } = appConfig;
  // const theme = getAppTheme(appTheme);

  try {
    // fs.writeJSONSync(appThemeFile, theme);
    fs.writeJSONSync(`${dir}/.norse/categories.json`, categories);
    fs.writeJSONSync(`${dir}/.norse/suggestions.json`, suggestions);
    fs.writeJSONSync(`${dir}/.norse/config.json`, rest);
    fs.writeFileSync(
      `${dir}/.norse/next.config.js`,
      `module.exports = ${JSON.stringify(appConfig.nextConfig ?? {})}`,
    );
    fs.rmSync(`${dir}/tmp`, { recursive: true });
  } catch (err) {
    process.exit(1);
  }
})();
