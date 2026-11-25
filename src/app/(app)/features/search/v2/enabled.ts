import type { AppConfig } from '@/types/appConfig';

/**
 * The tenant's v2 switch: Payload `enableV2Api` (super-admin only, default off). Off means the
 * tenant's site keeps the v1 `/search` page and has no `/find`.
 */
export const isV2Enabled = (
  appConfig: Pick<AppConfig, 'featureFlags'> | null | undefined,
): boolean => appConfig?.featureFlags?.enableV2Api === true;
