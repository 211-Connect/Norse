const fs = require('fs');
const path = require('path');

module.exports = {
  getAppConfig() {
    let appConfig;

    try {
      appConfig = fs.readFileSync(path.resolve('./.norse/config.json'));
    } catch (err) {}

    if (!appConfig) {
      try {
        appConfig = fs.readFileSync(path.resolve('./app.defaults.json'));
      } catch (err) {}
    }

    appConfig = JSON.parse(appConfig);

    return appConfig;
  },
};
