import { cache } from 'react';

export const getAppConfig = cache((): any => {
  let appConfig = {};
  try {
    appConfig = require('../../../../../.norse/config.json');
  } catch (err) {
    try {
      appConfig = require('../../../../../app.defaults.json');
    } catch (err2) {
      appConfig = {};
    }
  }

  return appConfig;
});
