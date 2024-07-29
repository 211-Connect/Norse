// This file is REQUIRED by react-i18next/next-i18next. DO NOT DELETE
const path = require('path');
const utils = require('./bin/utils');

const appConfig = utils.getAppConfig();

module.exports = {
  i18n: {
    defaultLocale: appConfig?.nextConfig?.i18n?.defaultLocale ?? 'en',
    locales: appConfig?.nextConfig?.i18n?.locales ?? ['en'],
    localePath: path.resolve('./public/locales'),
  },
};
