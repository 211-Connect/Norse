export type HybridSearchConfigCache = {
  tenant_id: string;
  vector_score_weight: number | null;
  base_taxonomy_boost: number | null;
  geo_gauss_weight: number | null;
  geo_default_scale_mi: number | null;
  pinned_score_boost: number | null;
  priority_score_weight: number | null;
  bm25_name_boost: number | null;
  bm25_service_name_boost: number | null;
  bm25_org_name_boost: number | null;
  bm25_taxonomy_use_ref_boost: number | null;
  taxonomy_k: number | null;
  taxonomy_num_candidates: number | null;
  boost_pinned_resources: boolean;
  enable_organization_search: boolean;
};
