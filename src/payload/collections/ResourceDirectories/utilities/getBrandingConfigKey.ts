export const getBrandingConfigKey = (tenantId: string, locale: string) => {
  return `branding_config:${tenantId}:${locale}`;
};
