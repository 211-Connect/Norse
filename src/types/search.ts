export type SearchAggregationBucket = {
  key: string;
  doc_count: number;
};

export type SearchAggregation = {
  doc_count_error_upper_bound: number;
  sum_other_doc_count: number;
  buckets: SearchAggregationBucket[];
};

export type SearchHitsTotal = { value: number; relation: string } | number;

export type SearchHitSource = {
  service_at_location_id?: string | null;
  priority?: number | null;
  service?: {
    name?: string | null;
    summary?: string | null;
    description?: string | null;
  } | null;
  name?: string | null;
  phone?: string | null;
  url?: string | null;
  location?: {
    physical_address?: {
      address_1?: string | null;
      address_2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
    } | null;
    point?: unknown;
  } | null;
  taxonomies?: unknown;
  facets?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SearchHit = {
  _index: string;
  _id: string;
  _score: number | null;
  _routing?: string;
  _source: SearchHitSource;
  sort?: unknown[];
};

export type SearchHits = {
  total: SearchHitsTotal;
  max_score: number | null;
  hits: SearchHit[];
};

export type ElasticsearchResponse = {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: SearchHits;
};

export type SearchFacet = {
  key: string;
  /** `locale` equals `en` when the request language is English */
  name: { en: string; locale: string };
  values: Array<{ en: string; locale: string; doc_count: number }>;
};

export type FilterBucket = {
  key: string;
  display: string;
  doc_count: number;
};

export type FilterEntry = {
  name: string;
  buckets: FilterBucket[];
};

export type FiltersMap = Record<string, FilterEntry>;

export type SearchApiResponse = {
  search: ElasticsearchResponse;
  facets?: SearchFacet[];
};
