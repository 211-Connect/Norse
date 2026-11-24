import type { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import type { AppConfig } from '@/types/appConfig';

/** The tenant's area search settings, sent with every area search (`region`). */
export function withAreaSettings(
  query: FindResourcesQuery,
  appConfig: Pick<AppConfig, 'search'>,
): FindResourcesQuery {
  if (!query.region) return query;
  return {
    ...query,
    areaMatch: appConfig.search.areaMatch,
    unlocated: appConfig.search.unlocatedInAreaSearch,
  };
}
