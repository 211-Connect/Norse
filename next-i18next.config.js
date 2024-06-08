// This file is REQUIRED by react-i18next/next-i18next. DO NOT DELETE
const path = require('path');
const fs = require('fs');

let appConfig;
try {
  fs.statSync(path.resolve('./app.config.json'));
  const _appConfig = fs.readFileSync('./app.config.json');
  appConfig = JSON.parse(_appConfig.toString());
} catch (err) {}

if (!appConfig) {
  try {
    fs.statSync(path.resolve('./app.defaults.json'));
    const _appConfig = fs.readFileSync('./app.defaults.json');
    appConfig = JSON.parse(_appConfig.toString());
  } catch (err) {}
}

if (!appConfig)
  throw new Error('Unable to load app.config.json or app.defaults.json');

module.exports = {
  i18n: {
    defaultLocale: appConfig?.i18n?.defaultLocale ?? 'en',
    locales: appConfig?.i18n?.locales ?? ['en', 'es'],
    localePath: path.resolve('./public/locales'),
  },
};
