export const getKeycloakIssuer = (realm: string) =>
  `${process.env.KEYCLOAK_ISSUER_BASE_URL ?? 'https://auth.c211.io'}/realms/${realm}`;
