import { buildLegalConfigCache } from '../utilities/buildLegalConfigCache';
import { getLegalConfigKey } from '../utilities/getLegalConfigKey';
import { createPushLocaleConfigToCache } from './createPushLocaleConfigToCache';

const { pushToCache: pushLegalConfigToCache, afterChangeHook: pushLegalConfigToCacheAfterChangeHook } =
  createPushLocaleConfigToCache(
    buildLegalConfigCache,
    getLegalConfigKey,
    'pushLegalConfigToCache',
    'legal config',
  );

export { pushLegalConfigToCache, pushLegalConfigToCacheAfterChangeHook };
