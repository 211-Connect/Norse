import type { ResourceDirectory } from '@/payload/payload-types';
import { DEFAULT_UNLOCATED } from '@/types/areaSearch';
import type { HybridSearchConfigCache } from '@/types/hybridSearchConfig';

/**
 * Builds the per-tenant search settings cache payload for the API from the
 * tenant's ResourceDirectory.
 *
 * Returns null when there is no ResourceDirectory for the tenant, since
 * there is nothing meaningful to cache in that case.
 */
export function buildHybridSearchConfigCache(
  tenantId: string,
  resourceDirectory: ResourceDirectory | null,
): HybridSearchConfigCache | null {
  if (!resourceDirectory) {
    return null;
  }

  const searchSettings = resourceDirectory.search?.searchSettings;
  const searchEngine = searchSettings?.searchEngine ?? 'classic';
  const isV2 = searchEngine === 'v2';
  const v2UsePinnedResources = searchSettings?.v2UsePinnedResources ?? true;

  // The 3-way pins and unlocated settings are hidden for v2, so their stored
  // values must not act there.
  const pinnedResourcesMode = isV2
    ? v2UsePinnedResources
      ? 'boost'
      : 'ignore'
    : (searchSettings?.pinnedResourcesMode ?? 'boost');
  const unlocatedInAreaSearch = isV2
    ? DEFAULT_UNLOCATED
    : (searchSettings?.unlocatedInAreaSearch ?? DEFAULT_UNLOCATED);

  return {
    tenant_id: tenantId,
    search_engine: searchEngine,
    v2_use_pinned_resources: v2UsePinnedResources,
    pinned_resources_mode: pinnedResourcesMode,
    enable_organization_search:
      resourceDirectory.featureFlags?.enableOrganizationSearch ?? false,
    enable_v2_api: resourceDirectory.featureFlags?.enableV2Api ?? false,
    // Defaults for area searches (GET /search `region`) when the caller sends none.
    area_match: searchSettings?.areaMatchMode ?? 'located_or_serving',
    unlocated_in_area_search: unlocatedInAreaSearch,
  };
}
