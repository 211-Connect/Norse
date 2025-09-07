const utils = require('./bin/utils.js');

const appConfig = utils.getAppConfig();

const { i18n, ...rest } = appConfig?.nextConfig ?? {};

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...(rest ?? {}),
};

module.exports = nextConfig;
