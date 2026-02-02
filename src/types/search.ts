import { Taxonomy, Facet, FacetWithTranslation } from './resource';

// -- Request Types --

import { BBox, Point, Geometry } from 'geojson';

export interface SearchStoreState {
  query: string;
  queryLabel: string;
  queryType: string;
  searchLocation: string;
  searchCoordinates: number[];
  searchDistance: string;
  searchPlaceType?: string[];
  searchBbox?: BBox | null;
}

export interface SearchQueryDto {
  query?: string | string[] | Record<string, string | number | boolean>;
  query_label?: string;
  query_type?: 'text' | 'taxonomy' | 'organization' | 'more_like_this';
  page?: number;
  coords?: number[];
  filters?: Record<string, string | string[]>;
  distance?: number;
  limit?: number;
  geo_type?: 'boundary' | 'proximity';
}

export interface SearchBodyDto {
  geometry?: Geometry;
}

// -- Response Types --

// Nested DTOs to match Norse API response structure
export interface ServiceDto {
  name: string;
  alternate_name?: string | null;
  description?: string | null;
  summary?: string | null;
}

export interface PhysicalAddressDto {
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
}

export interface LocationDto {
  name: string;
  alternate_name?: string | null;
  description?: string | null;
  summary?: string | null;
  point?: { lat: number; lon: number } | [number, number] | string | null;
  physical_address?: PhysicalAddressDto | null;
}

export interface OrganizationDto {
  name: string;
  alternate_name?: string | null;
  description?: string | null;
  summary?: string | null;
}

export interface TaxonomyDto {
  code: string;
  name: string;
  description?: string | null;
}

export interface SearchSource {
  id: string;
  service_at_location_id: string;
  name: string;
  description?: string | null;
  summary?: string | null;
  phone?: string | null;
  url?: string | null;
  email?: string | null;
  schedule?: string | null;
  service_area?: Geometry | null;
  service: ServiceDto;
  location: LocationDto;
  organization: OrganizationDto;
  taxonomies: TaxonomyDto[];
  facets: Record<string, any>;
  tenant_id: string;
  priority: number;
  pinned: boolean;
}

export interface SearchHit {
  _index: string;
  _id: string;
  _score: number | null;
  _routing?: string;
  _source: SearchSource;
  sort?: number[];
}

export interface AggregationBucket {
  key: string;
  doc_count: number;
}

export interface SearchAggregations {
  [key: string]: {
    buckets: AggregationBucket[];
  };
}

export interface SearchResponseRoot {
  search: {
    took: number;
    timed_out: boolean;
    _shards: {
      total: number;
      successful: number;
      skipped: number;
      failed: number;
    };
    hits: {
      total:
        | {
            value: number;
            relation: string;
          }
        | number;
      max_score: number | null;
      hits: SearchHit[];
    };
    aggregations?: SearchAggregations;
  };
  facets?: Record<string, any>;
}

// -- Transformed Types for UI --
// This matches the current return shape of findResources

export interface SearchResultItem {
  _id: string;
  id?: string | null;
  priority?: number;
  serviceName?: string | null;
  name?: string | null;
  summary?: string | null;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  location?: Point | null;
  taxonomies?: Taxonomy[] | null;
  facets?: FacetWithTranslation[] | null;
}

export interface FindResourcesResult {
  results: SearchResultItem[];
  noResults: boolean;
  totalResults: number;
  page: number;
  filters: Record<string, { buckets: AggregationBucket[] }>;
}
