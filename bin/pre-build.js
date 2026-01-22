const createAppFromStrapi = require('./createAppFromStrapi');
const getAppTheme = require('./getAppTheme');
const fs = require('fs-extra');

const dir = process.cwd();

(async () => {
  try {
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

    // fs.writeJSONSync(appThemeFile, theme);
    fs.writeJSONSync(`${dir}/.norse/categories.json`, categories);
    fs.writeJSONSync(`${dir}/.norse/suggestions.json`, suggestions);
    fs.writeJSONSync(`${dir}/.norse/config.json`, rest);
    fs.writeFileSync(
      `${dir}/.norse/next.config.js`,
      `module.exports = ${JSON.stringify(appConfig.nextConfig ?? {})}`,
    );
    if (fs.existsSync(`${dir}/tmp`)) {
       fs.rmSync(`${dir}/tmp`, { recursive: true });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
