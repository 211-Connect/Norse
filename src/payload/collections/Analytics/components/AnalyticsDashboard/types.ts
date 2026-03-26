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
