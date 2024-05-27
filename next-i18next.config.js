// This file is REQUIRED by react-i18next/next-i18next. DO NOT DELETE
const path = require('path');
const config = require('./.norse/config.json');

module.exports = {
  i18n: {
    defaultLocale: config?.i18n?.defaultLocale ?? 'en',
    locales: config?.i18n?.locales ?? ['en'],
    localePath: path.resolve('./public/locales'),
  },
};
