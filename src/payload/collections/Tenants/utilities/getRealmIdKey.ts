export const getRealmIdKey = (tenantId: string) => {
  return `keycloak_realm_id:${tenantId}`;
};
