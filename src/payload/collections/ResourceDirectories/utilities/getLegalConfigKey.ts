export const getLegalConfigKey = (tenantId: string, locale: string) => {
  return `legal_config:${tenantId}:${locale}`;
};
