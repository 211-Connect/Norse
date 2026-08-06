export enum WidgetSlug {
  TotalUsers = 'analytics-total-users',
  Searches = 'analytics-searches',
  AverageSearches = 'analytics-average-searches',
  ResourceViews = 'analytics-resource-views',
  ZeroResults = 'analytics-zero-results',
  WebsiteClicks = 'analytics-website-clicks',
  PhoneCalls = 'analytics-phone-calls',
  SmsClicks = 'analytics-sms-clicks',
  Directions = 'analytics-directions',
  TotalReferrals = 'analytics-total-referrals',
  WidgetSearches = 'analytics-widget-searches',
  CalloutClicks = 'analytics-callout-clicks',
  HighlightClicks = 'analytics-highlight-clicks',
  AlertClicks = 'analytics-alert-clicks',
  PageViews = 'analytics-page-views',
  PageviewsChart = 'analytics-pageviews-chart',
  Map = 'analytics-map',
  ResourceTitles = 'analytics-resource-titles',
  SearchQueries = 'analytics-search-queries',
  ZipCodeSearches = 'analytics-zip-code-searches',
  CountySearches = 'analytics-county-searches',
  ResourceEntryPoints = 'analytics-resource-entry-points',
  ZeroResultQueries = 'analytics-zero-result-queries',
  SessionQuality = 'analytics-session-quality',
  DeviceTypes = 'analytics-device-types',
  SafeExitClicks = 'analytics-safe-exit-clicks',
  LanguageSwitchDestinations = 'analytics-language-switch-destinations',
  FavoriteAddToList = 'analytics-favorite-add-to-list',
  VerifiedUsers = 'analytics-verified-users',
  EventCard = 'analytics-event-card',
}

// Default layout for the analytics dashboard. Used both to sanitize the
// real Payload config (so the server-side "Reset Layout" action restores
// this layout) and by AnalyticsView when rendering the dashboard.
export const ANALYTICS_DEFAULT_LAYOUT = [
  { widgetSlug: WidgetSlug.TotalUsers, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.Searches, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.PageViews, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.ResourceViews, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.ZeroResults, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.WebsiteClicks, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.PhoneCalls, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.SmsClicks, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.Directions, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.PageviewsChart, width: 'full' as const },
  { widgetSlug: WidgetSlug.ResourceTitles, width: 'medium' as const },
  { widgetSlug: WidgetSlug.SearchQueries, width: 'medium' as const },
];

export const WIDGET_INFO: Record<WidgetSlug, string> = {
  [WidgetSlug.TotalUsers]: 'The number of unique visitors to the site.',
  [WidgetSlug.Searches]:
    'The number of searches users perform using the search bar or guided search links. Deep linked resources and deep linked search results do not appear in this measure.',
  [WidgetSlug.AverageSearches]:
    'The average number of searches performed per user session.',
  [WidgetSlug.ResourceViews]:
    'The number of times that a resource details page is viewed.',
  [WidgetSlug.ZeroResults]: 'The number of searches that had 0 results.',
  [WidgetSlug.WebsiteClicks]:
    'The number of times that users click on the Website button or website link.',
  [WidgetSlug.PhoneCalls]:
    'The number of times that users click on the Call button or the phone number link.',
  [WidgetSlug.SmsClicks]:
    'The number of times that users click the SMS button.',
  [WidgetSlug.Directions]:
    'The number of times users click on the Directions button.',
  [WidgetSlug.TotalReferrals]:
    'The total number of website, phone, and directions clicks combined.',
  [WidgetSlug.WidgetSearches]:
    'The number of searches that came from the search widget.',
  [WidgetSlug.CalloutClicks]:
    'The number of times uses have clicked call out buttons on New Layout.',
  [WidgetSlug.HighlightClicks]:
    'The number of times users have clicked on a highlight button on the home page.',
  [WidgetSlug.AlertClicks]:
    'The number of times users have clicked an alert button on the home page.',
  [WidgetSlug.PageViews]: 'The number of pages viewed.',
  [WidgetSlug.PageviewsChart]: 'The number of page views each day.',
  [WidgetSlug.Map]: 'The geographic origin of user traffic.',
  [WidgetSlug.ResourceTitles]:
    'This table ranks the specific resources that users click on the most. Referrals are the total number of times that users clicked on either phone, website, or directions for that resource.',
  [WidgetSlug.SearchQueries]:
    'The most frequent searches on the site. The buttons at the bottom sort by the type of search—taxonomy, text, or hybrid.',
  [WidgetSlug.ZeroResultQueries]:
    'This table lists the searches that yielded 0 results.',
  [WidgetSlug.ZipCodeSearches]:
    'The number of searches and searches with 0 results by zip code.',
  [WidgetSlug.CountySearches]:
    'The number of searches and searches with 0 results by county.',
  [WidgetSlug.ResourceEntryPoints]:
    'Page views sorted by search results, topic cards, and deep link/ external.',
  [WidgetSlug.SessionQuality]:
    'The approximate duration of user sessions. Short - Less than 1 minute. Balanced - 1-5 minutes. Meaningful - More than 5 minutes.',
  [WidgetSlug.DeviceTypes]:
    'The types of devices that are used to access the site.',
  [WidgetSlug.SafeExitClicks]:
    'The number of times users click on the Safe Exit feature.',
  [WidgetSlug.LanguageSwitchDestinations]:
    'The number of times users change the site language sorted by language users changed to.',
  [WidgetSlug.FavoriteAddToList]: 'The number of resources added to favorites.',
  [WidgetSlug.VerifiedUsers]: 'The total number of verified user accounts.',
  [WidgetSlug.EventCard]:
    'Display the number of custom events. Intended for API analytics from partners.',
};
