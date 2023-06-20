// to make the file a module and avoid the TypeScript error
export {};

type Facets = {
  id: number;
  facet: string;
  name: string;
};

declare global {
  namespace Express {
    export interface Request {
      tenant: {
        name: string;
        tenantId: string;
        facets: Facets[];
        keycloakRealmId: string;
        appConfig: {
          brandName: string;
          keycloakConfig: {
            id: number;
            clientSecret: string;
            realm: string;
            clientId: string;
          };
        };
      };
      user: {
        id: string;
      };
      origin: string;
    }
  }
}
