export type SearchSettingsSibling = { searchEngine?: string | null } | null;

export const isV2Engine = (
  searchSettingsSibling: SearchSettingsSibling | undefined,
): boolean => searchSettingsSibling?.searchEngine === 'v2';

/** Settings the v2 engine does not use: hidden for v2, and fixed at their defaults. */
export const V2_HIDDEN_FIELDS = [
  {
    name: 'pinnedResourcesMode',
    label: 'Pinned Resources Mode',
    defaultValue: 'boost',
  },
  {
    name: 'unlocatedInAreaSearch',
    label: 'Area search: resources with no address and no service area',
    defaultValue: 'virtual',
  },
] as const;

/** Setting that only the v2 engine uses. */
export const V2_ONLY_FIELD = {
  name: 'v2UsePinnedResources',
  label: 'Use pinned resources',
  defaultValue: true,
} as const;
