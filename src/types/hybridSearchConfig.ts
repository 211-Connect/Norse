import type { AreaMatch, Unlocated } from './areaSearch';

export type HybridSearchConfigCache = {
  tenant_id: string;
  search_engine: 'classic' | 'hybrid' | 'ai_classification' | 'v2';
  v2_use_pinned_resources: boolean;
  pinned_resources_mode: 'ignore' | 'boost' | 'top';
  enable_organization_search: boolean;
  enable_v2_api: boolean;
  area_match: AreaMatch;
  unlocated_in_area_search: Unlocated;
};
