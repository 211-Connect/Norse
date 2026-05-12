export enum UmamiEvent {
  SearchZeroResults = 'search_zero_results',
  DirectionClick = 'direction_click',
  PhoneClick = 'phone_click',
  WebsiteClick = 'website_click',
  SafeExitClick = 'safe_exit_click',
  WidgetSearch = 'widget_search',
  SearchTaxonomy = 'search_taxonomy',
  SearchText = 'search_text',
}

export function trackUmamiEvent(
  event: UmamiEvent,
  data?: Record<string, string>,
): void {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(event, data);
  }
}
