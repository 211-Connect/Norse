export type DateRange = 7 | 30 | 90 | { start: string; end: string };

export type HeatmapPoint = [number, number, number?];

export type SearchQueryType = 'text' | 'taxonomy' | 'hybrid';

export type SearchByLabelByType = Record<SearchQueryType, MetricEntry[]>;

export type MetricsData = {
  metrics: AnalyticsMetrics;
  resourceMetrics: MetricEntry[];
  searchByLabel: MetricEntry[];
};

export type PathsData = {
  tenantId?: string;
  searchCount: number;
  prevSearchCount: number;
  resourceMetrics: MetricEntry[];
  prevResourceMetrics: MetricEntry[];
  searchByLabelByType: SearchByLabelByType;
};

export type EventsData = {
  eventTotals: Record<string, number>;
  prevEventTotals: Record<string, number>;
};

export type ZeroResultQueriesData = {
  zeroResultQueries: MetricEntry[];
};

export type LanguageSwitchDestinationsData = {
  languageSwitchDestinations: MetricEntry[];
};

export type ResourceByEntryData = {
  resourceByEntry: MetricEntry[];
};

export type SessionsData = {
  sessions: UmamiSession[];
};

export type SessionHeatmapData = {
  heatmapPoints: HeatmapPoint[];
};

export interface MetricEntry {
  x: string;
  y: number;
}

export interface MetricsExpandedEntry {
  name: string;
  pageviews: string;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: string;
}

export interface ResourceTitleEntry {
  id: string;
  displayName: string;
}

export interface UmamiPageviews {
  pageviews: MetricEntry[];
  sessions: MetricEntry[];
}

export interface UmamiSession {
  id: string;
  websiteId: string;
  hostname: string;
  browser: string;
  os: string;
  device: string;
  screen: string;
  language: string;
  country: string;
  region: string;
  city: string;
  firstAt: string;
  lastAt: string;
  visits: number;
  views: number;
  createdAt: string;
}

export interface UmamiSessionResponse {
  data: UmamiSession[];
}

export interface UmamiEventDataValue {
  value: string;
  total: number;
}

export interface UmamiStats {
  bounces: number;
  comparison: {
    bounces: number;
    pageviews: number;
    totaltime: number;
    visitors: number;
    visits: number;
  };
  pageviews: number;
  totaltime: number;
  visitors: number;
  visits: number;
}

export interface AnalyticsMetrics {
  searches: Metric;
  resourceViews: Metric;
  zeroResults: Metric;
  directions: Metric;
  phoneCalls: Metric;
  websiteClicks: Metric;
  widgetSearches: Metric;
  calloutClicks: Metric;
}

export interface Metric {
  current: number;
  previous: number;
}
