import type { AreaMatch, Unlocated } from './areaSearch';

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
  pinned_resources_mode: 'ignore' | 'boost' | 'top';
  enable_organization_search: boolean;
  area_match: AreaMatch;
  unlocated_in_area_search: Unlocated;
  // Emergency hotlines for the v2 emergency question, in display order. [] means Norse-API uses 988 and 911.
  hotlines: { label: string; number: string }[];
};
