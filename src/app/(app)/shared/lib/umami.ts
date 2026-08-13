export enum UmamiEvent {
  FavoriteAddToList = 'favorite_add_to_list',
  LanguageSwitch = 'language_switch',
  SearchZeroResults = 'search_zero_results',
  DirectionClick = 'direction_click',
  PhoneClick = 'phone_click',
  WebsiteClick = 'website_click',
  SmsClick = 'sms_click',
  SafeExitClick = 'safe_exit_click',
  WidgetSearch = 'widget_search',
  SearchTaxonomy = 'search_taxonomy',
  SearchText = 'search_text',
  SearchHybrid = 'search_hybrid',
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

const PENDING_ENTRY_STORAGE_PREFIX = 'resource-entry:';

/**
 * Records which UI surface a navigation to a resource page originated from,
 * without putting it in the destination href's query string (a non-routing
 * query string in a prefetchable `<Link>` href causes Next.js's Segment
 * Cache to create an extra prefetch request per link — see
 * `docs/agents/prefetch-href-search-params-cost.md`).
 *
 * Call this from the source link's `onClick` right before navigation, and
 * read it back on the destination page via `consumePendingResourceEntry`.
 */
export function setPendingResourceEntry(
  resourceId: string,
  entry: ResourceEntry,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      `${PENDING_ENTRY_STORAGE_PREFIX}${resourceId}`,
      entry,
    );
  } catch {
    // best-effort; never block navigation on storage errors
  }
}

/**
 * Reads and clears the `entry` value recorded by `setPendingResourceEntry`
 * for a given resource id. One-shot by design, mirroring the URL cleanup in
 * `use-resource-view-tracking.ts`. Returns `undefined` if nothing was
 * recorded (e.g. deep link, bookmark, reload, back/forward navigation).
 */
export function consumePendingResourceEntry(
  resourceId: string,
): ResourceEntry | undefined {
  if (typeof window === 'undefined') return undefined;
  const key = `${PENDING_ENTRY_STORAGE_PREFIX}${resourceId}`;
  try {
    const rawEntry = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
    if (rawEntry == null) return undefined;
    return RESOURCE_ENTRY_VALUES.has(rawEntry)
      ? (rawEntry as ResourceEntry)
      : undefined;
  } catch {
    return undefined;
  }
}

type PendingUmamiEvent = {
  event: UmamiEvent;
  payload?: Record<string, string>;
};

// Caps how many events we'll buffer while waiting for the Umami script to
// load, so a permanently-blocked/failed script (ad blocker, ITP, missing
// config) can't leak memory in a long-lived tab.
const MAX_PENDING_UMAMI_EVENTS = 50;

const pendingUmamiEvents: PendingUmamiEvent[] = [];

export function flushPendingUmamiEvents(): void {
  if (typeof window === 'undefined' || !window.umami) return;

  while (pendingUmamiEvents.length > 0) {
    const next = pendingUmamiEvents.shift();
    if (next) {
      window.umami.track(next.event, next.payload);
    }
  }
}

export function trackUmamiEvent(
  event: UmamiEvent,
  data?: Record<string, string>,
  sessionId?: string,
): void {
  if (typeof window === 'undefined') return;

  const payload = sessionId ? { ...data, session_id: sessionId } : data;

  if (window.umami) {
    window.umami.track(event, payload);
    return;
  }

  if (pendingUmamiEvents.length >= MAX_PENDING_UMAMI_EVENTS) {
    pendingUmamiEvents.shift();
  }
  pendingUmamiEvents.push({ event, payload });
}
