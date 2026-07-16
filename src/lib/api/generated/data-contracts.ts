/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface TaxonomyItemDto {
  /**
   * Unique identifier of the taxonomy term
   * @example "ee9dd652-19d7-5226-bd7c-3c01f8144f2a"
   */
  id: string;
  /**
   * Taxonomy code
   * @example "FT-2700.9500"
   */
  code: string;
  /**
   * Taxonomy term name
   * @example "Will Preparation Assistance"
   */
  name: string;
}

export interface TaxonomyResponseDto {
  /**
   * Total number of matching results
   * @example 40
   */
  total: number;
  /**
   * Current page number
   * @example 1
   */
  page: number;
  /** Array of taxonomy items */
  items: TaxonomyItemDto[];
}

export interface ServiceDto {
  name: string;
  alert: object | null;
  alternate_name: object | null;
  description: object | null;
  summary: object | null;
  eligibility: object | null;
  application_process: object | null;
}

export interface PhysicalAddressDto {
  address_1: object | null;
  address_2: object | null;
  city: object | null;
  state: object | null;
  country: object | null;
  postal_code: object | null;
}

export interface LocationDto {
  name: string;
  alternate_name: object | null;
  description: object | null;
  summary: object | null;
  point: object | null;
  physical_address: PhysicalAddressDto | null;
}

export interface OrganizationDto {
  name: string;
  alternate_name: object | null;
  description: object | null;
  summary: object | null;
}

export interface TaxonomyDto {
  code: string;
  name: string;
  description: object | null;
}

export interface SearchSource {
  id: string;
  service_at_location_id: string;
  name: string;
  description: object | null;
  summary: object | null;
  phone: object | null;
  url: object | null;
  email: object | null;
  schedule: object | null;
  service_area: object | null;
  service: ServiceDto;
  location: LocationDto;
  organization: OrganizationDto;
  taxonomies: TaxonomyDto[];
  facets: object;
  tenant_id: string;
  priority: number;
  pinned: boolean;
  attribution: string;
}

export interface SearchHit {
  _index: string;
  _id?: string;
  _score?: object | null;
  _routing: object | null;
  _source?: SearchSource;
  sort: number[] | null;
}

export interface SearchHitsContainer {
  /** @example {"value":100,"relation":"eq"} */
  total: object;
  max_score: object | null;
  hits: SearchHit[];
}

export interface SearchResponseDto {
  search: SearchHitsContainer;
  facets: string[];
}

export interface AiSearchOptionDto {
  code: string;
  score: number;
  /** Whether this need should be pre-selected in UI */
  pre_selected: boolean;
  /** Number of results for this need */
  results_count: object | null;
}

export interface AiSearchPredictResponseDto {
  scenario:
    | "search"
    | "clarify_low_info"
    | "clarify_multiple_labels"
    | "search_and_notify_low_info"
    | "search_and_notify_low_confidence";
  hsis_taxonomies: string[];
  options: AiSearchOptionDto[];
}

export interface AiSearchReRankResponseDto {
  hsis_taxonomies: string[];
}

export type CreateFavoriteDto = object;

export type CreateFavoriteListDto = object;

export interface SyncFavoriteListDto {
  /**
   * Resource IDs stored locally that should be matched against the authenticated user favorite lists.
   * @example ["resource-1","resource-2"]
   */
  resourceIds: string[];
}

export interface FavoriteListSyncResponseDto {
  id: string;
  name: string;
  description: string;
  privacy: string;
  ownerId: string;
  /** Whether the list contains the specified resource (only present when resource_id is provided) */
  containsResource?: boolean;
  favorites: string[];
}

export interface FavoriteListItemDto {
  id: string;
  name: string;
  description: string;
  privacy: string;
  ownerId: string;
  /** Whether the list contains the specified resource (only present when resource_id is provided) */
  containsResource?: boolean;
}

export interface FavoriteListResponseDto {
  /**
   * Total number of matching results
   * @example 40
   */
  total: number;
  /**
   * Current page number
   * @example 1
   */
  page: number;
  items: FavoriteListItemDto[];
}

export interface FavoriteListDetailResponseDto {
  id: string;
  name: string;
  description: string;
  privacy: string;
  ownerId: string;
  /** Whether the list contains the specified resource (only present when resource_id is provided) */
  containsResource?: boolean;
  /** Populated favorites (resources) */
  favorites: object[];
}

export type UpdateFavoriteListDto = object;

export interface ResourceTitlesDto {
  /**
   * Array of resource UUIDs
   * @maxItems 100
   * @minItems 1
   * @example ["550e8400-e29b-41d4-a716-446655440000"]
   */
  ids: string[];
}

export interface ResourceBatchDto {
  /**
   * Array of resource UUIDs to fetch
   * @maxItems 100
   * @minItems 1
   * @example ["550e8400-e29b-41d4-a716-446655440000","550e8400-e29b-41d4-a716-446655440001"]
   */
  ids: string[];
}

export interface ResourceBatchErrorDto {
  /**
   * The resource ID that failed
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;
  /**
   * Error reason
   * @example "Resource not found"
   */
  reason: string;
  /**
   * HTTP status code
   * @example 404
   */
  statusCode: number;
}

export interface ResourceBatchResponseDto {
  /**
   * Successfully fetched resources, keyed by resource ID
   * @example {"550e8400-e29b-41d4-a716-446655440000":{"_id":"550e8400-e29b-41d4-a716-446655440000","displayName":"Example Resource"}}
   */
  data: Record<string, object>;
  /**
   * Failed resource IDs with error details
   * @example [{"id":"550e8400-e29b-41d4-a716-446655440001","reason":"Resource not found","statusCode":404}]
   */
  errors: ResourceBatchErrorDto[];
  /**
   * Metadata about the batch operation
   * @example {"requested":2,"successful":1,"failed":1}
   */
  meta: object;
}

export interface ForwardGeocodeResponseDto {
  /**
   * Type of the result
   * @example "coordinates"
   */
  type: "coordinates" | "invalid";
  /**
   * Formatted address
   * @example "123 Main St, New York, NY 10001, United States"
   */
  address: string;
  /**
   * Coordinates [longitude, latitude]
   * @example [-74.006,40.7128]
   */
  coordinates: number[];
  /**
   * Postcode of the location
   * @example "10001"
   */
  postcode?: string;
  /**
   * Place/city name
   * @example "New York"
   */
  place?: string;
  /**
   * District name
   * @example "Manhattan"
   */
  district?: string;
  /**
   * Region/state name
   * @example "New York"
   */
  region?: string;
  /**
   * Country name
   * @example "United States"
   */
  country?: string;
  /**
   * Array of feature types
   * @example ["address"]
   */
  place_type?: string[];
  /**
   * Bounding box [minLng, minLat, maxLng, maxLat]
   * @example [-74.007,40.712,-74.005,40.714]
   */
  bbox?: number[];
}

export interface ReverseGeocodeResponseDto {
  /**
   * Type of the result
   * @example "coordinates"
   */
  type: "coordinates" | "invalid";
  /**
   * Formatted address
   * @example "123 Main St, New York, NY 10001, United States"
   */
  address: string;
  /**
   * Coordinates [longitude, latitude]
   * @example [-74.006,40.7128]
   */
  coordinates: number[];
  /**
   * Postcode of the location
   * @example "10001"
   */
  postcode?: string;
  /**
   * Place/city name
   * @example "New York"
   */
  place?: string;
  /**
   * District name
   * @example "Manhattan"
   */
  district?: string;
  /**
   * Region/state name
   * @example "New York"
   */
  region?: string;
  /**
   * Country name
   * @example "United States"
   */
  country?: string;
  /**
   * Array of feature types
   * @example ["address"]
   */
  place_type?: string[];
  /**
   * Bounding box [minLng, minLat, maxLng, maxLat]
   * @example [-74.007,40.712,-74.005,40.714]
   */
  bbox?: number[];
}

export interface AnalyticsInfoResponse {
  /**
   * Root Umami website ID for this tenant
   * @example "abc-123"
   */
  rootWebsiteId: string;
  /**
   * Additional website IDs associated with this tenant
   * @example ["def-456","ghi-789"]
   */
  additionalWebsiteIds: string[];
}

export interface StatsResponse {
  /**
   * Number of bounces
   * @example 100
   */
  bounces: number;
  /**
   * Number of pageviews
   * @example 1000
   */
  pageviews: number;
  /**
   * Total time spent on site in seconds
   * @example 3600
   */
  totaltime: number;
  /**
   * Number of unique visitors
   * @example 200
   */
  visitors: number;
  /**
   * Number of visits
   * @example 250
   */
  visits: number;
  /** Comparison stats for the previous period */
  comparison: object;
}

export interface PageviewsResponse {
  /**
   * Date of the pageviews
   * @example "2025-01-01"
   */
  date: string;
  /**
   * Number of page views on this date
   * @example 320
   */
  hits: number;
}

export interface AnalyticsMetricsResponse {
  /**
   * Total number of search queries performed
   * @example 500
   */
  searches: number;
  /**
   * Total number of resource detail views
   * @example 300
   */
  resourceViews: number;
  /**
   * Number of searches that returned zero results
   * @example 45
   */
  zeroResults: number;
  /**
   * Number of times directions were requested
   * @example 80
   */
  directions: number;
  /**
   * Number of phone call interactions initiated
   * @example 60
   */
  phoneCalls: number;
  /**
   * Number of website link clicks from resource listings
   * @example 120
   */
  websiteClicks: number;
  /**
   * Number of searches performed via the embedded widget
   * @example 150
   */
  widgetSearches: number;
  /**
   * Number of callout/banner link clicks
   * @example 35
   */
  calloutClicks: number;
  /**
   * Number of times users switched language
   * @example 12
   */
  languageSwitches: number;
  /**
   * Number of times a resource was viewed via an event
   * @example 30
   */
  resourceViewed: number;
}

export interface ResourceMetricsResponse {
  /**
   * Display name of the resource
   * @example "Food Bank"
   */
  title: string;
  /**
   * Number of views for this resource
   * @example 142
   */
  views: number;
}

export interface SearchHits {
  /**
   * Search query string
   * @example "example search query"
   */
  query: string;
  /**
   * Number of hits for the search query
   * @example 42
   */
  hits: number;
}

export interface SearchesResponse {
  /** Search queries and their hit counts for text searches */
  text: SearchHits[];
  /** Search queries and their hit counts for taxonomy searches */
  taxonomy: SearchHits[];
  /** Search queries and their hit counts for hybrid searches */
  hybrid: SearchHits[];
}

export interface ZeroResultQueriesResponse {
  /**
   * Search query string that returned zero results
   * @example "free wifi"
   */
  query: string;
  /**
   * Number of times this query returned zero results
   * @example 28
   */
  hits: number;
}

export interface LanguageSwitchesResponse {
  /**
   * Destination language code the user switched to
   * @example "fr"
   */
  language: string;
  /**
   * Number of times users switched to this language
   * @example 45
   */
  count: number;
}

export interface ResourceByEntryResponse {
  /**
   * Entry page path from which the resource was viewed
   * @example "/search?query_label=food"
   */
  entry: string;
  /**
   * Number of resource views originating from this entry page
   * @example 73
   */
  count: number;
}

export interface SessionsResponse {
  /**
   * Session UUID
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  id: string;
  /**
   * Website UUID the session belongs to
   * @example "def-456"
   */
  websiteId: string;
  /**
   * Hostname of the website
   * @example "example.com"
   */
  hostname: string;
  /**
   * Browser used during the session
   * @example "Chrome"
   */
  browser: string;
  /**
   * Operating system of the visitor
   * @example "Windows"
   */
  os: string;
  /**
   * Device type (desktop, mobile, tablet)
   * @example "desktop"
   */
  device: string;
  /**
   * Screen resolution of the visitor
   * @example "1920x1080"
   */
  screen: string;
  /**
   * Browser language of the visitor
   * @example "en-US"
   */
  language: string;
  /**
   * Country code of the visitor
   * @example "US"
   */
  country: string;
  /**
   * Region/state of the visitor
   * @example "California"
   */
  region: string;
  /**
   * City of the visitor
   * @example "San Francisco"
   */
  city: string;
  /**
   * ISO-8601 timestamp of the first visit
   * @example "2025-01-01T00:00:00Z"
   */
  firstAt: string;
  /**
   * ISO-8601 timestamp of the last visit
   * @example "2025-01-31T23:59:59Z"
   */
  lastAt: string;
  /**
   * Number of visits in this session
   * @example 5
   */
  visits: number;
  /**
   * Number of page views in this session
   * @example 12
   */
  views: number;
  /**
   * ISO-8601 timestamp when the session was created
   * @example "2025-01-01T00:00:00Z"
   */
  createdAt: string;
}

export interface PaginatedSessionsResponse {
  /**
   * Current page number
   * @example 1
   */
  page: number;
  /**
   * Number of sessions per page
   * @example 100
   */
  limit: number;
  /**
   * Total number of sessions returned on this page
   * @example 42
   */
  count: number;
  /** List of sessions for the requested page */
  data: SessionsResponse[];
}

export interface SearchEventExportRow {
  /**
   * ISO-8601 timestamp of the search event
   * @example "2025-01-15T14:23:45.000Z"
   */
  timestamp: string;
  /**
   * User search query string
   * @example "homeless shelter"
   */
  queryLabel: string;
  /**
   * Search type: text or taxonomy
   * @example "text"
   */
  queryType: "text" | "taxonomy";
  /**
   * Search coordinates in "longitude,latitude" format
   * @example "-122.4194,37.7749"
   */
  coordinates: object | null;
  /**
   * ZIP/postal code from reverse geocoding
   * @example "94102"
   */
  zipCode: object | null;
}

export interface ExportSearchDataResponse {
  /** Array of search event export rows */
  data: SearchEventExportRow[];
  /**
   * Total number of exported rows
   * @example 1523
   */
  totalCount: number;
}

export interface EventPayloadDto {
  /**
   * Event name (1-255 characters)
   * @example "resource_viewed"
   */
  name: string;
  /**
   * Additional event data (key-value pairs)
   * @example {"resourceId":"123","resourceType":"library"}
   */
  data?: object;
  /**
   * ISO-8601 timestamp
   * @example "2024-06-26T15:00:00.000Z"
   */
  timestamp: string;
}

export interface SendEventDto {
  /**
   * Umami website ID (UUID v4)
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  websiteId: string;
  /** Event payload */
  payload: EventPayloadDto;
}

export interface SendEventResponseDto {
  /**
   * Whether the event was sent successfully
   * @example true
   */
  success: boolean;
}

export interface SendBatchDto {
  /** Array of events to send (max 100) */
  events: SendEventDto[];
}

export interface SendBatchResponseDto {
  /**
   * Whether all events were sent successfully
   * @example true
   */
  success: boolean;
  /**
   * Number of events processed
   * @example 10
   */
  processed: number;
  /**
   * Number of events that failed
   * @example 0
   */
  errors: number;
  /**
   * Details of failed events
   * @example []
   */
  details: {
    index?: number;
    error?: string;
  }[];
}

export interface ScorecardNeedResponseDto {
  /** @example {"FO-200":0.9,"EM-100":0.1} */
  weights: Record<string, number>;
  /** @example "FO-200" */
  top_category_code: object | null;
  /** @example 0.9 */
  top_weight: object | null;
  /** @example ["FO-200","EM-100"] */
  need_categories_present: string[];
}

export interface TaxonomyScorecardPayloadResponseDto {
  need: ScorecardNeedResponseDto;
  /** @example null */
  target_population?: object | null;
  /** @example null */
  urgency?: object | null;
}

export interface TaxonomySourceResponseDto {
  /** @example "default" */
  owner: string;
  /** @example null */
  customization_version: object | null;
  /** @example true */
  isProduction: boolean;
  /** @example "2026-06-05T12:00:00.000Z" */
  published_at: string;
}

export interface VersionMetadataResponseDto {
  /** @example 3 */
  next_version: number;
  /** @example 2 */
  active_version: object | null;
  /** @example "update" */
  last_action: "update" | "enable";
}

export interface TaxonomyScorecardResponseDto {
  /** @example "BD::default" */
  _id: string;
  /** @example "BD" */
  hsis_code: string;
  /** @example "Food" */
  hsis_name: string;
  /** @example null */
  scorecard_version: object | null;
  /** @example null */
  taxonomy_version: object | null;
  scorecard: TaxonomyScorecardPayloadResponseDto;
  /** @example ["need"] */
  components_available: string[];
  source: TaxonomySourceResponseDto;
  /** @example {"0":{"version_id":"0","scorecard":{"need":{"weights":{"FO-200":0.9},"top_category_code":"FO-200","top_weight":0.9,"need_categories_present":["FO-200"]},"target_population":null,"urgency":null},"source":{"owner":"tenant-1","customization_version":null,"isProduction":true,"published_at":"2026-06-05T12:00:00.000Z"},"created_at":"2026-06-05T12:00:00.000Z"}} */
  versions: Record<string, ScorecardVersionEntryResponseDto>;
  version_metadata: VersionMetadataResponseDto;
  /** @example "admin@payload.local" */
  updated_by_email?: object | null;
  /** @example "2026-06-05T12:00:00.000Z" */
  updated_at: string;
}

export interface ScorecardVersionEntryResponseDto {
  /** @example "0" */
  version_id: string;
  scorecard: TaxonomyScorecardPayloadResponseDto;
  source: TaxonomySourceResponseDto;
  /** @example "2026-06-05T12:00:00.000Z" */
  created_at: string;
  /** @example "admin@payload.local" */
  created_by_email?: object | null;
}

export interface ScorecardTaxonomyItemDto {
  /** @example "BD-4000.300" */
  code: string;
  /** @example "Food Pantries" */
  name: string;
}

export interface SearchScorecardTaxonomiesResponseDto {
  /** @example 2112 */
  total: number;
  /** @example 1 */
  page: number;
  /** @example 10 */
  limit: number;
  items: ScorecardTaxonomyItemDto[];
}

export interface UpdateTaxonomyScorecardDto {
  /**
   * Need score weights to set as active configuration
   * @example {"FO-200":0.9,"EM-100":0.1}
   */
  weights: Record<string, number>;
  /**
   * When true, apply the same weights to selected taxonomy and all structural descendants based on taxonomy hierarchy levels
   * @default false
   */
  include_children?: boolean;
  /**
   * When true, apply the same weights to direct siblings that share the same structural parent and level
   * @default false
   */
  include_siblings?: boolean;
  /**
   * Updater email for published saves. Ignored for draft saves.
   * @example "admin@payload.local"
   */
  updated_by_email?: string | null;
}

export interface UpdateTaxonomyScorecardResponseDto {
  /** @example "bad518d2-c4f3-4e41-9692-17b48f2f384e" */
  tenant_id: string;
  /** @example ["BD","BD-100.2000"] */
  affected_codes: string[];
  /**
   * Taxonomies that would be impacted if a draft version is enabled
   * @example ["BD","BD-100.2000"]
   */
  potentially_affected_codes?: string[];
  /** @example 2 */
  new_version_count: number;
}

export interface EnableTaxonomyScorecardDto {
  /**
   * Version identifier to enable
   * @min 0
   * @example 2
   */
  version_id: number;
}

export interface OrchestrationConfigControllerGetCustomAttributesParams {
  /**
   * Optional schema name to filter custom attributes
   * @example "openreferral"
   */
  schema?: string;
}

export type OrchestrationConfigControllerGetCustomAttributesData = any;

export interface OrchestrationConfigControllerGetTenantLocalesParams {
  /**
   * Tenant ID to fetch enabled locales for
   * @example "1"
   */
  tenantId: string;
}

/** @example ["en","es","fr"] */
export type OrchestrationConfigControllerGetTenantLocalesData = string[];

export interface OrchestrationConfigControllerGetTenantFacetsParams {
  /**
   * Tenant ID to fetch facets for
   * @example "1"
   */
  tenantId: string;
}

/** @example [{"facet":"age_groups","name":"Age Groups","es":"Grupos de edad"},{"facet":"services","name":"Services","es":"Servicios"}] */
export type OrchestrationConfigControllerGetTenantFacetsData = {
  /** @example "age_groups" */
  facet?: string;
  /** @example "Age Groups" */
  name?: string;
  [key: string]: any;
}[];

export interface OrchestrationConfigControllerGetAllTenantConfigParams {
  /**
   * Tenant ID to fetch complete configuration for (locales + facets)
   * @example "1"
   */
  tenantId: string;
}

export interface OrchestrationConfigControllerGetAllTenantConfigData {
  /** @example ["en","es","fr"] */
  locales?: string[];
  /** @example [{"facet":"age_groups","name":"Age Groups","es":"Grupos de edad"}] */
  facets?: {
    facet?: string;
    name?: string;
  }[];
}

export type CmsConfigControllerClearAllCachesData = any;

export interface CmsConfigControllerClearTenantCacheParams {
  /**
   * Tenant ID to clear cache for
   * @example "tenant123"
   */
  tenantId: string;
}

export type CmsConfigControllerClearTenantCacheData = any;

export interface TaxonomyControllerGetTaxonomiesV2Params {
  /**
   * Page number for pagination
   * @default 1
   */
  page?: any;
  /**
   * Taxonomy code (deprecated, use query instead)
   * @deprecated
   */
  code?: any;
  /** Search query for taxonomy name or code */
  query?: any;
}

export type TaxonomyControllerGetTaxonomiesV2Data = TaxonomyResponseDto;

export interface TaxonomyControllerGetTaxonomyTermsByCodeParams {
  /**
   * Taxonomy code(s) to look up. Can be a single code or comma-separated codes.
   * @example "NAICS-11"
   */
  terms?: any;
}

export type TaxonomyControllerGetTaxonomyTermsByCodeData = any;

export interface SearchControllerGetResourcesParams {
  /** Search query. Can be a simple string, comma separated strings, or a JSON object with OR and AND nested conditions. */
  query?:
    | string
    | string[]
    | {
        OR?: {
          AND?: string[];
        }[];
        AND?: {
          AND?: string[];
          OR?: string[];
        }[];
      };
  /**
   * Sort order: relevance (default), distance (requires coords), name (alphabetical by resource name), organization (alphabetical by provider name)
   * @default "relevance"
   */
  sort?: "relevance" | "distance" | "name" | "organization";
  /**
   * Comma-delimited HSIS taxonomy codes used as a hard scope for hybrid search (e.g. BM-1400,BM-1700)
   * @example "BM-1400,BM-1700"
   */
  taxonomy?: string;
  /** @default "text" */
  query_type?: "text" | "taxonomy" | "more_like_this" | "hybrid";
  /**
   * Searcher age used to match minimum_age/service.maximum_age
   * @min 0
   */
  age?: number;
  /** @default 1 */
  page?: any;
  /**
   * Comma delimited list of longitude,latitude
   * @example "-120.740135,47.751076"
   */
  coords?: any;
  filters?: object;
  /**
   * @min 0
   * @default 0
   */
  distance?: number;
  /**
   * @min 25
   * @max 300
   * @default 25
   */
  limit?: number;
}

export type SearchControllerGetResourcesData = SearchResponseDto;

export interface SearchControllerGetResourcesPostPayload {
  /** GeoJSON geometry */
  geometry?: object;
}

export interface SearchControllerGetResourcesPostParams {
  /** Search query. Can be a simple string, comma separated strings, or a JSON object with OR and AND nested conditions. */
  query?:
    | string
    | string[]
    | {
        OR?: {
          AND?: string[];
        }[];
        AND?: {
          AND?: string[];
          OR?: string[];
        }[];
      };
  /**
   * Sort order: relevance (default), distance (requires coords), name (alphabetical by resource name), organization (alphabetical by provider name)
   * @default "relevance"
   */
  sort?: "relevance" | "distance" | "name" | "organization";
  /**
   * Comma-delimited HSIS taxonomy codes used as a hard scope for hybrid search (e.g. BM-1400,BM-1700)
   * @example "BM-1400,BM-1700"
   */
  taxonomy?: string;
  /** @default "text" */
  query_type?: "text" | "taxonomy" | "more_like_this" | "hybrid";
  /**
   * Searcher age used to match minimum_age/maximum_age
   * @min 0
   */
  age?: number;
  /** @default 1 */
  page?: any;
  /**
   * Comma delimited list of longitude,latitude
   * @example "-120.740135,47.751076"
   */
  coords?: any;
  filters?: object;
  /**
   * @min 0
   * @default 0
   */
  distance?: number;
  /**
   * @min 25
   * @max 300
   * @default 25
   */
  limit?: number;
}

export type SearchControllerGetResourcesPostData = SearchResponseDto;

export interface SearchControllerPredictNeedsClassificationParams {
  query: string;
  /**
   * Number of candidates to request from ML Broker (default 150)
   * @min 1
   * @default 150
   */
  top_k?: number;
}

export type SearchControllerPredictNeedsClassificationData =
  AiSearchPredictResponseDto;

export interface SearchControllerReRankNeedsClassificationParams {
  /** JSON string map of need weights (URL-encoded), e.g. {"HO-300":0.9,"IC-330":0.08} */
  need_weights: string;
  /**
   * Number of candidates to request from ML Broker (default 150)
   * @min 1
   * @default 150
   */
  top_k?: number;
}

export type SearchControllerReRankNeedsClassificationData =
  AiSearchReRankResponseDto;

export interface ShortUrlControllerGetShortUrlByIdParams {
  id: string;
}

export type ShortUrlControllerGetShortUrlByIdData = any;

export type ShortUrlControllerGetOrCreateShortUrlData = any;

export type HealthControllerGetStatusData = any;

export type FavoriteControllerCreateData = any;

export interface FavoriteControllerRemoveParams {
  favoriteId: string;
  favoriteListId: string;
}

export type FavoriteControllerRemoveData = any;

export type FavoriteListControllerCreateData = any;

export interface FavoriteListControllerFindAllParams {
  /**
   * @min 1
   * @max 100
   * @default 1
   */
  page?: number;
  /**
   * @min 1
   * @max 300
   * @default 25
   */
  limit?: number;
  search?: string;
  /** Resource ID to check if it exists in each list */
  resource_id?: string;
}

export type FavoriteListControllerFindAllData = FavoriteListResponseDto;

export type FavoriteListControllerSyncLocalListData =
  FavoriteListSyncResponseDto;

export interface FavoriteListControllerSearchParams {
  name?: string;
  exclude?: string;
  /**
   * @min 1
   * @max 100
   * @default 1
   */
  page?: number;
  /**
   * @min 1
   * @max 300
   * @default 25
   */
  limit?: number;
  search?: string;
  /** Resource ID to check if it exists in each list */
  resource_id?: string;
}

export type FavoriteListControllerSearchData = FavoriteListResponseDto;

export interface FavoriteListControllerFindOneParams {
  id: string;
}

export type FavoriteListControllerFindOneData = FavoriteListDetailResponseDto;

export interface FavoriteListControllerUpdateParams {
  id: string;
}

export type FavoriteListControllerUpdateData = any;

export interface FavoriteListControllerRemoveParams {
  id: string;
}

export type FavoriteListControllerRemoveData = any;

export interface FavoriteListControllerPurgeParams {
  id: string;
}

export type FavoriteListControllerPurgeData = any;

export interface ResourceControllerGetResourceByIdParams {
  id: string;
}

export type ResourceControllerGetResourceByIdData = any;

export interface ResourceControllerGetResourceByOriginalIdParams {
  /** Original Resource ID */
  id: string;
}

export type ResourceControllerGetResourceByOriginalIdData = any;

export type ResourceControllerGetResourceTitlesByIdsData = any;

export type ResourceControllerGetResourcesBatchData = ResourceBatchResponseDto;

export interface SuggestionControllerGetTaxonomiesParams {
  /** @default 1 */
  page?: any;
  /** @deprecated */
  code?: any;
  query?: any;
}

export type SuggestionControllerGetTaxonomiesData = any;

export type SuggestionControllerGetTaxonomyTermsByCodeData = any;

export interface GeocodingControllerForwardGeocodeParams {
  /**
   * Address to geocode
   * @example "123 Main St, New York, NY"
   */
  address: string;
  /**
   * Geocoding module to query
   * @default "mapbox"
   * @example "mapbox"
   */
  provider?: "mapbox" | "opencage";
  /**
   * Maximum number of results to return
   * @min 1
   * @max 10
   * @default 5
   * @example 5
   */
  limit?: number;
}

export type GeocodingControllerForwardGeocodeData = ForwardGeocodeResponseDto[];

export interface GeocodingControllerReverseGeocodeParams {
  /**
   * Coordinates in format "longitude,latitude"
   * @example "-74.006,40.7128"
   */
  coordinates: any[];
  /**
   * Geocoding module to query
   * @default "mapbox"
   * @example "mapbox"
   */
  provider?: "mapbox" | "opencage";
}

export type GeocodingControllerReverseGeocodeData = ReverseGeocodeResponseDto[];

export type AnalyticsControllerGetInfoData = AnalyticsInfoResponse;

export interface AnalyticsControllerGetStatsParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetStatsData = StatsResponse;

export interface AnalyticsControllerGetPageviewsParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
  /**
   * IANA timezone
   * @default "UTC"
   * @example "UTC"
   */
  timezone?: string;
}

export type AnalyticsControllerGetPageviewsData = PageviewsResponse[];

export interface AnalyticsControllerGetMetricsParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
  /**
   * IANA timezone
   * @default "UTC"
   * @example "UTC"
   */
  timezone?: string;
}

export type AnalyticsControllerGetMetricsData = AnalyticsMetricsResponse;

export interface AnalyticsControllerGetResourceMetricsParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetResourceMetricsData =
  ResourceMetricsResponse[];

export interface AnalyticsControllerGetSearchesParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetSearchesData = SearchesResponse;

export interface AnalyticsControllerGetZeroResultQueriesParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetZeroResultQueriesData =
  ZeroResultQueriesResponse[];

export interface AnalyticsControllerGetLanguageSwitchesParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetLanguageSwitchesData =
  LanguageSwitchesResponse[];

export interface AnalyticsControllerGetResourceByEntryParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetResourceByEntryData =
  ResourceByEntryResponse[];

export interface AnalyticsControllerGetSessionsParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
  /**
   * Page number for pagination
   * @default 1
   * @example 1
   */
  page?: number;
  /**
   * Number of sessions per page
   * @default 100
   * @example 100
   */
  limit?: number;
}

export type AnalyticsControllerGetSessionsData = PaginatedSessionsResponse;

export interface AnalyticsControllerGetExportSearchDataParams {
  /**
   * ISO-8601 start date
   * @example "2025-01-01T00:00:00Z"
   */
  start: string;
  /**
   * ISO-8601 end date. Must be ≥ start, not in the future, and within 365 days of start.
   * @example "2025-01-31T23:59:59Z"
   */
  end: string;
  /**
   * Optional comma-separated Umami website IDs to filter by. If omitted, the tenant root website is used.
   * @example "abc-123,def-456"
   */
  websiteIds?: string;
}

export type AnalyticsControllerGetExportSearchDataData =
  ExportSearchDataResponse;

export type AnalyticsControllerSendEventData = SendEventResponseDto;

export type AnalyticsControllerSendBatchData = SendBatchResponseDto;

export interface TaxonomyScorecardControllerSearchTaxonomiesParams {
  /**
   * Tenant identifier used to filter taxonomy search results
   * @example "bad518d2-c4f3-4e41-9692-17b48f2f384e"
   */
  tenant_id: string;
  /**
   * Search query for taxonomy name/code
   * @example "BD"
   */
  query: string;
  /**
   * Pagination page index
   * @default 1
   */
  page?: any;
  /**
   * Page size
   * @default 10
   */
  limit?: any;
}

export type TaxonomyScorecardControllerSearchTaxonomiesData =
  SearchScorecardTaxonomiesResponseDto;

export interface TaxonomyScorecardControllerGetTaxonomyConfigurationParams {
  tenantId: string;
  hsisCode: string;
}

export type TaxonomyScorecardControllerGetTaxonomyConfigurationData =
  TaxonomyScorecardResponseDto;

export interface TaxonomyScorecardControllerUpdateTaxonomyConfigurationParams {
  /**
   * When true, saves new version as draft only and keeps active version unchanged
   * @default false
   */
  draft?: boolean;
  tenantId: string;
  hsisCode: string;
}

export type TaxonomyScorecardControllerUpdateTaxonomyConfigurationData =
  UpdateTaxonomyScorecardResponseDto;

export interface TaxonomyScorecardControllerEnableTaxonomyScorecardVersionParams {
  tenantId: string;
  hsisCode: string;
}

export type TaxonomyScorecardControllerEnableTaxonomyScorecardVersionData =
  TaxonomyScorecardResponseDto;
