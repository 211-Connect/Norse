export type SuggestionCacheItem = {
  id?: string;
  taxonomies: string;
  value: string;
  values: Record<string, string>;
};

export type SuggestionsCache = {
  tenantId: string;
  suggestions: SuggestionCacheItem[];
};
