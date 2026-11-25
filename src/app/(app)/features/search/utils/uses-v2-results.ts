/** Which results list a tenant gets: the v2 list only with `enableV2Api` on. */
export const usesV2Results = (
  appConfig: { featureFlags?: { enableV2Api?: boolean } } | null | undefined,
) => appConfig?.featureFlags?.enableV2Api === true;
