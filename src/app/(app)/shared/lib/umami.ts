export enum UmamiEvent {
  SearchZeroResults = 'search_zero_results',
  DirectionClick = 'direction_click',
  PhoneClick = 'phone_click',
  SearchSuggestionClick = 'search_suggestion_click',
  SearchManualClick = 'search_manual_click',
  WebsiteClick = 'website_click',
  WidgetSearch = 'widget_search',
}

export function trackUmamiEvent(
  event: UmamiEvent,
  data?: Record<string, string>,
): void {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(event, data);
  }
}
