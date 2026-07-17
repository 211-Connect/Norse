export type DateRange = 7 | 30 | 90 | { start: string; end: string };

export type SearchQueryType = 'text' | 'taxonomy' | 'hybrid';

export interface MetricEntry {
  x: string;
  y: number;
}

export type AreaMetricsRow = {
  area: string;
  totalSearches: number;
  zeroSearches: number;
  zeroRate: number;
};
