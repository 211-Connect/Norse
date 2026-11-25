import type { ResourceDirectory } from '@/payload/payload-types';
import type { HybridSearchConfigCache } from '@/types/hybridSearchConfig';

type SearchSettingsHotlines = NonNullable<
  NonNullable<ResourceDirectory['search']>['searchSettings']
>['hotlines'];

/** Keeps order, trims, and drops rows with a blank label or number. */
export function toCacheHotlines(
  hotlines: SearchSettingsHotlines | null | undefined,
): HybridSearchConfigCache['hotlines'] {
  return (hotlines ?? [])
    .map((h) => ({
      label: (h.label ?? '').trim(),
      number: (h.number ?? '').trim(),
    }))
    .filter((h) => h.label !== '' && h.number !== '');
}

/**
 * The tenant's hotlines for the app config. Only a v2 tenant (`enableV2Api` on) gets the list;
 * for any other tenant the part is empty, so the v1 config carries no `hotlines` key at all.
 */
export function searchHotlinesFor(
  enableV2Api: boolean | null | undefined,
  hotlines: SearchSettingsHotlines | null | undefined,
): { hotlines?: HybridSearchConfigCache['hotlines'] } {
  return enableV2Api ? { hotlines: toCacheHotlines(hotlines) } : {};
}
