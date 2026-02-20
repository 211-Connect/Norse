export type FacetConfig = {
  facet: string;
  name: string;
  [locale: string]: string;
};

export type FacetsCache = {
  tenantId: string;
  facets: FacetConfig[];
};
