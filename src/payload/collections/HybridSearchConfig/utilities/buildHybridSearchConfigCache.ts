import type {
  HybridSearchConfig,
  ResourceDirectory,
} from '@/payload/payload-types';
import { DEFAULT_UNLOCATED } from '@/types/areaSearch';
import type { HybridSearchConfigCache } from '@/types/hybridSearchConfig';

/**
 * Merges the tenant's HybridSearchConfig weight overrides with the
 * pinnedResourcesMode value from the tenant's ResourceDirectory search
 * settings into a single cache payload for the API.
 *
 * Returns null when there is no ResourceDirectory for the tenant, since
 * there is nothing meaningful to cache in that case.
 */
export function buildHybridSearchConfigCache(
  tenantId: string,
  hybridSearchConfig: HybridSearchConfig | null,
  resourceDirectory: ResourceDirectory | null,
): HybridSearchConfigCache | null {
  if (!resourceDirectory) {
    return null;
  }

  const pinnedResourcesMode =
    resourceDirectory.search?.searchSettings?.pinnedResourcesMode ?? 'boost';

  const searchSettings = resourceDirectory.search?.searchSettings;

  const enableOrganizationSearch =
    resourceDirectory.featureFlags?.enableOrganizationSearch ?? false;

  const enableV2Api = resourceDirectory.featureFlags?.enableV2Api ?? false;

  return {
    tenant_id: tenantId,
    vector_score_weight: hybridSearchConfig?.vectorScoreWeight ?? null,
    base_taxonomy_boost: hybridSearchConfig?.baseTaxonomyBoost ?? null,
    geo_gauss_weight: hybridSearchConfig?.geoGaussWeight ?? null,
    geo_default_scale_mi: hybridSearchConfig?.geoDefaultScaleMi ?? null,
    pinned_score_boost: hybridSearchConfig?.pinnedScoreBoost ?? null,
    priority_score_weight: hybridSearchConfig?.priorityScoreWeight ?? null,
    bm25_name_boost: hybridSearchConfig?.bm25NameBoost ?? null,
    bm25_service_name_boost: hybridSearchConfig?.bm25ServiceNameBoost ?? null,
    bm25_org_name_boost: hybridSearchConfig?.bm25OrgNameBoost ?? null,
    bm25_taxonomy_use_ref_boost:
      hybridSearchConfig?.bm25TaxonomyUseRefBoost ?? null,
    taxonomy_k: hybridSearchConfig?.taxonomyK ?? null,
    taxonomy_num_candidates: hybridSearchConfig?.taxonomyNumCandidates ?? null,
    pinned_resources_mode: pinnedResourcesMode,
    enable_organization_search: enableOrganizationSearch,
    enable_v2_api: enableV2Api,
    // Defaults for area searches (GET /search `region`) when the caller sends none.
    area_match: searchSettings?.areaMatchMode ?? 'located_or_serving',
    unlocated_in_area_search:
      searchSettings?.unlocatedInAreaSearch ?? DEFAULT_UNLOCATED,
  };
}
