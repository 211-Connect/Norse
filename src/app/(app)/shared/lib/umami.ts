export enum UmamiEvent {
  FavoriteAddToList = 'favorite_add_to_list',
  LanguageSwitch = 'language_switch',
  SearchZeroResults = 'search_zero_results',
  DirectionClick = 'direction_click',
  PhoneClick = 'phone_click',
  WebsiteClick = 'website_click',
  SafeExitClick = 'safe_exit_click',
  WidgetSearch = 'widget_search',
  SearchTaxonomy = 'search_taxonomy',
  SearchText = 'search_text',
  CalloutClick = 'callout_click',
  ResourceViewed = 'resource_viewed',
  HighlightClick = 'highlight_click',
  AlertClick = 'alert_click',
}

export enum ResourceEntry {
  SearchCard = 'search_card',
  TopicCard = 'topic_card',
  DeepLink = 'deep_link',
  Unknown = 'unknown',
}

const RESOURCE_ENTRY_VALUES = new Set<string>(Object.values(ResourceEntry));

export function resolveResourceEntry(
  rawEntry: string | undefined | null,
): ResourceEntry {
  if (rawEntry == null || rawEntry === '') return ResourceEntry.DeepLink;
  return RESOURCE_ENTRY_VALUES.has(rawEntry)
    ? (rawEntry as ResourceEntry)
    : ResourceEntry.Unknown;
}

export function trackUmamiEvent(
  event: UmamiEvent,
  data?: Record<string, string>,
  sessionId?: string,
): void {
  if (typeof window !== 'undefined' && window.umami) {
    const payload = sessionId ? { ...data, session_id: sessionId } : data;
    window.umami.track(event, payload);
  }
}
