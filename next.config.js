const utils = require('./bin/utils.js');

const appConfig = utils.getAppConfig();

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // ...(appConfig?.nextConfig ?? {}),
};

module.exports = nextConfig;
