export type DateRange = 7 | 30 | 90;

export interface MetricEntry {
  x: string;
  y: number;
}

export interface ResourceTitleEntry {
  id: string;
  displayName: string;
}

export interface UmamiPageviews {
  pageviews: MetricEntry[];
  sessions: MetricEntry[];
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
