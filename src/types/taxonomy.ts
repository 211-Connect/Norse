/**
 * Taxonomy type definitions based on Norse API structure
 * Aligned with taxonomies_v2 Elasticsearch index
 */

/**
 * Represents a taxonomy document from the taxonomies_v2 Elasticsearch index
 */
export interface TaxonomyDocument {
  /** Taxonomy name (search_as_you_type field) */
  name: string;

  /** Taxonomy description */
  description?: string;

  /** Taxonomy ID (non-indexed text field) */
  id: string;

  /** Taxonomy classification/category */
  taxonomy?: string;

  /** Tenant identifier */
  tenant_id: string;

  /** Taxonomy code (search_as_you_type with raw keyword) */
  code: string;

  /** Type of taxonomy entry */
  type?: string;

  /** Creation timestamp */
  created_at: string | Date;

  /** Last update timestamp */
  updated_at: string | Date;
}

/**
 * Elasticsearch search hit for taxonomy documents
 */
export interface TaxonomyHit {
  _index: string;
  _id?: string;
  _score?: number | null;
  _source?: TaxonomyDocument;
}

/**
 * Response from taxonomy search operations
 * Aligned with Elasticsearch SearchResponse structure
 */
export interface TaxonomySearchResponse {
  hits: {
    total?:
      | number
      | {
          value: number;
          relation: string;
        };
    max_score?: number | null;
    hits: TaxonomyHit[];
  };
  took?: number;
  timed_out?: boolean;
  _shards?: {
    total: number;
    successful: number;
    skipped?: number;
    failed: number;
  };
  aggregations?: Record<string, any>;
}

/**
 * Simplified taxonomy term used in the UI
 * Extracted from TaxonomyDocument
 */
export interface TaxonomyTerm {
  id: string;
  code: string;
  name: string;
  description?: string;
}
