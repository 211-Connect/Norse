import { buildBrandingConfigCache } from '../utilities/buildBrandingConfigCache';
import { getBrandingConfigKey } from '../utilities/getBrandingConfigKey';
import { createPushLocaleConfigToCache } from './createPushLocaleConfigToCache';

const {
  pushToCache: pushBrandingConfigToCache,
  afterChangeHook: pushBrandingConfigToCacheAfterChangeHook,
} = createPushLocaleConfigToCache(
  buildBrandingConfigCache,
  getBrandingConfigKey,
  'pushBrandingConfigToCache',
  'branding config',
);

export { pushBrandingConfigToCache, pushBrandingConfigToCacheAfterChangeHook };
