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
  alert: string | null;
  alternate_name: string | null;
  description: string | null;
  summary: string | null;
  eligibility: string | null;
  application_process: string | null;
}

export interface PhysicalAddressDto {
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
}

export interface LocationDto {
  name: string;
  alternate_name: string | null;
  description: string | null;
  summary: string | null;
  point: object | null;
  physical_address: PhysicalAddressDto | null;
}

export interface OrganizationDto {
  name: string;
  alternate_name: string | null;
  description: string | null;
  summary: string | null;
}

export interface TaxonomyDto {
  code: string;
  name: string;
  description: string | null;
}

export interface SearchSource {
  id: string;
  service_at_location_id: string;
  name: string;
  description: string | null;
  summary: string | null;
  phone: string | null;
  url: string | null;
  email: string | null;
  schedule: string | null;
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
  _score?: number | null;
  _routing: string | null;
  _source?: SearchSource;
  sort: number[] | null;
}

export interface SearchHitsContainer {
  /** @example {"value":100,"relation":"eq"} */
  total: object;
  max_score: number | null;
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
  results_count: number | null;
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

export interface ResourceLocationOpenApiDto {
  /** @example "Point" */
  type: string;
  /** @example [-106.0746,42.1485] */
  coordinates: number[];
}

export interface ResourceAddressOpenApiDto {
  address_1?: string;
  address_2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  type?: string;
  rank?: number;
}

export interface ResourcePhoneNumberOpenApiDto {
  type?: string;
  number?: string;
  rank?: number;
}

export interface ResourceTaxonomyOpenApiDto {
  code?: string;
  name?: string;
}

export interface ResourceTranslationOpenApiDto {
  locale?: string;
  displayName?: string;
  serviceName?: string;
  serviceDescription?: string;
  organizationDescription?: string;
  hours?: string;
  fees?: string;
  alert?: string;
  taxonomies?: ResourceTaxonomyOpenApiDto[];
  attributeValues?: Record<string, any>;
}

export interface ResourceFacetOpenApiDto {
  code?: string;
  taxonomyName?: string;
  termName?: string;
}

export interface TransformedResourceOpenApiDto {
  _id: string;
  originalId?: string;
  displayName?: string;
  displayPhoneNumber?: string;
  website?: string;
  organizationUrl?: string;
  email?: string;
  organizationName?: string;
  location?: ResourceLocationOpenApiDto;
  addresses?: ResourceAddressOpenApiDto[];
  phoneNumbers?: ResourcePhoneNumberOpenApiDto[];
  languages?: string[];
  /** Service area geometry + metadata */
  serviceArea?: Record<string, any>;
  attribution?: string;
  createdAt?: string;
  updatedAt?: string;
  lastAssuredDate?: string;
  tenantId?: string;
  tenant_id?: string;
  translation?: ResourceTranslationOpenApiDto;
  facetsEn?: ResourceFacetOpenApiDto[];
}

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

export interface ResourceBatchMetaDto {
  /**
   * Requested IDs count
   * @example 2
   */
  requested: number;
  /**
   * Successfully resolved resources count
   * @example 1
   */
  successful: number;
  /**
   * Failed IDs count
   * @example 1
   */
  failed: number;
}

export interface ResourceBatchResponseDto {
  /**
   * Successfully fetched resources, keyed by resource ID
   * @example {"550e8400-e29b-41d4-a716-446655440000":{"_id":"550e8400-e29b-41d4-a716-446655440000","displayName":"Example Resource"}}
   */
  data: Record<string, TransformedResourceOpenApiDto>;
  /**
   * Failed resource IDs with error details
   * @example [{"id":"550e8400-e29b-41d4-a716-446655440001","reason":"Resource not found","statusCode":404}]
   */
  errors: ResourceBatchErrorDto[];
  /** Metadata about the batch operation */
  meta: ResourceBatchMetaDto;
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

export interface AnalyticsWebsiteName {
  /**
   * Umami website ID
   * @example "abc-123"
   */
  id: string;
  /**
   * Human-readable website name from Umami
   * @example "My Resource Directory"
   */
  name: string;
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
  /** Website IDs with display names for the website picker */
  websites: AnalyticsWebsiteName[];
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
  /**
   * Number of safe exit link clicks
   * @example 25
   */
  safeExitClicks: number;
  /**
   * Number of favorites added to a list
   * @example 40
   */
  favoriteAddToList: number;
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
   * Search ZIP/postal code from reverse geocoding
   * @example "94102"
   */
  searchZipCode: string | null;
  /**
   * Search city from reverse geocoding
   * @example "San Francisco"
   */
  searchCity: string | null;
  /**
   * Search latitude coordinate
   * @example 37.7749
   */
  searchLatitude: number | null;
  /**
   * Search longitude coordinate
   * @example -122.5678
   */
  searchLongitude: number | null;
  /**
   * User ZIP/postal code from reverse geocoding
   * @example "94102"
   */
  userZipCode: string | null;
  /**
   * User city from reverse geocoding
   * @example "San Francisco"
   */
  userCity: string | null;
  /**
   * User latitude coordinate
   * @example 37.7749
   */
  userLatitude: number | null;
  /**
   * User longitude coordinate
   * @example -122.5678
   */
  userLongitude: number | null;
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

export interface HeatmapPointResponse {
  /**
   * Longitude coordinate
   * @example -122.41942
   */
  lng: number;
  /**
   * Latitude coordinate
   * @example 37.77493
   */
  lat: number;
  /**
   * Aggregate weight (number of searches) at this location
   * @example 15
   */
  weight: number;
}

export interface AreaMetricsRow {
  /**
   * Area identifier (ZIP code or county name)
   * @example "55101"
   */
  area: string;
  /**
   * Total number of searches in this area
   * @example 50
   */
  totalSearches: number;
  /**
   * Number of searches that returned zero results in this area
   * @example 5
   */
  zeroSearches: number;
  /**
   * Ratio of zero-result searches to total searches
   * @example 0.1
   */
  zeroRate: number;
}

export interface AreaSearchesResponse {
  /** Metrics grouped by ZIP code */
  zipCodeRows: AreaMetricsRow[];
  /** Metrics grouped by county */
  countyRows: AreaMetricsRow[];
}

export interface EventValuesResponse {
  /**
   * Distinct property value
   * @example "homeless shelter"
   */
  value: string;
  /**
   * Total occurrences of this value
   * @example 42
   */
  total: number;
}

export interface EventCatalogEntryResponse {
  /**
   * Umami event name
   * @example "search_zero_results"
   */
  eventName: string;
  /**
   * Available property names for this event
   * @example ["query","queryLabel","userCoordinates"]
   */
  properties: string[];
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
  top_category_code: string | null;
  /** @example 0.9 */
  top_weight: number | null;
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
  customization_version: string | null;
  /** @example true */
  isProduction: boolean;
  /** @example "2026-06-05T12:00:00.000Z" */
  published_at: string;
}

export interface VersionMetadataResponseDto {
  /** @example 3 */
  next_version: number;
  /** @example 2 */
  active_version: number | null;
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
  scorecard_version: string | null;
  /** @example null */
  taxonomy_version: string | null;
  scorecard: TaxonomyScorecardPayloadResponseDto;
  /** @example ["need"] */
  components_available: string[];
  source: TaxonomySourceResponseDto;
  /** @example {"0":{"version_id":"0","scorecard":{"need":{"weights":{"FO-200":0.9},"top_category_code":"FO-200","top_weight":0.9,"need_categories_present":["FO-200"]},"target_population":null,"urgency":null},"source":{"owner":"tenant-1","customization_version":null,"isProduction":true,"published_at":"2026-06-05T12:00:00.000Z"},"created_at":"2026-06-05T12:00:00.000Z"}} */
  versions: Record<string, ScorecardVersionEntryResponseDto>;
  version_metadata: VersionMetadataResponseDto;
  /** @example "admin@payload.local" */
  updated_by_email?: string | null;
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
  created_by_email?: string | null;
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

export interface SearchQueryApiDto {
  /**
   * Search query expression. Can be plain text, string array, or nested AND/OR object payload.
   * @example "housing"
   */
  query?: string | string[] | Record<string, any>;
  /** @default "text" */
  query_type?: "text" | "taxonomy" | "more_like_this" | "hybrid";
  /**
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * Comma-delimited longitude,latitude
   * @example "-120.740135,47.751076"
   */
  coords?: string;
  /** @example {"county":"King","language":["en","es"]} */
  filters?: Record<string, any>;
  /**
   * HSIS taxonomy scope as comma-delimited string or array
   * @example "BM-1400,BM-1700"
   */
  taxonomy?: string | string[];
  /**
   * @min 0
   * @default 0
   */
  distance?: number;
  /** @min 0 */
  age?: number;
  /**
   * @min 25
   * @max 300
   * @default 25
   */
  limit?: number;
  geo_type?: "boundary" | "proximity";
  /** @default "relevance" */
  sort?: "relevance" | "distance" | "name" | "organization";
}

export interface SearchBodyApiDto {
  /** GeoJSON geometry payload for POST /search */
  geometry?: Record<string, any>;
}

export interface PrintableDirectorySourceQueryDto {
  /** @example "Housing Search Block" */
  title?: string;
  /**
   * Serialized search query parameters aligned with /search API query contract
   * @example {"query":"housing","query_type":"text","page":1,"limit":25}
   */
  params: SearchQueryApiDto;
  /**
   * Optional serialized /search POST body
   * @example {"geometry":{"type":"Point","coordinates":[-120.7,47.7]}}
   */
  body?: SearchBodyApiDto;
}

export interface CreatePrintableDirectorySourceDto {
  type: "query" | "favorites_list" | "resource_ids";
  query?: PrintableDirectorySourceQueryDto;
  /** @example "favorites-list-id" */
  favoritesListId?: string;
  /** @example ["resource-a","resource-b"] */
  resourceIds?: string[];
}

export interface UpdatePrintableDirectorySourceDto {
  type?: "query" | "favorites_list" | "resource_ids";
  query?: PrintableDirectorySourceQueryDto;
  /** @example "favorites-list-id" */
  favoritesListId?: string;
  /** @example ["resource-a","resource-b"] */
  resourceIds?: string[];
}

export interface PrintableDirectoryLocalizedTextResponseDto {
  /** @example {"en":"Default copy","es":"Texto predeterminado"} */
  values: Record<string, string>;
}

export interface PrintableDirectoryCoverResponseDto {
  titleLocalized: PrintableDirectoryLocalizedTextResponseDto;
  descriptionLocalized: PrintableDirectoryLocalizedTextResponseDto;
  primaryColor?: string | null;
  /** @example "default" */
  layoutType: "default";
  coverImageUrlFront?: string | null;
  coverImageUrlBack?: string | null;
}

export interface PrintableDirectoryHeaderFooterResponseDto {
  /** @example ["text","logo","domain","date"] */
  layout: ("text" | "logo" | "domain" | "date")[];
  textLocalized?: PrintableDirectoryLocalizedTextResponseDto;
  logoUrl?: string | null;
}

export interface PrintableDirectoryCoordsDto {
  /**
   * @min -90
   * @max 90
   * @example 47.6062
   */
  latitude?: number;
  /**
   * @min -180
   * @max 180
   * @example -122.3321
   */
  longitude?: number;
}

export interface PrintableDirectoryDefaultQueryConfigDto {
  /**
   * @maxLength 200
   * @example "Seattle, WA"
   */
  locationName?: string | null;
  /** @example {"latitude":47.6062,"longitude":-122.3321} */
  coords?: PrintableDirectoryCoordsDto | null;
  /**
   * @min 0
   * @max 1000
   * @example 25
   */
  radius?: number | null;
}

export interface PrintableDirectorySourceQueryResponseDto {
  title?: string | null;
  /**
   * Serialized /search query parameters. Common keys include query_type, query, page, limit, filters, coords, distance, age, geo_type, taxonomy, and sort.
   * @example {"query_type":"text","query":"housing","page":1,"limit":25,"coords":"-120.740135,47.751076","sort":"relevance"}
   */
  params: SearchQueryApiDto;
  /**
   * Optional serialized /search POST body. Used when query resolution requires geometry payload (for example polygon/bounding-box intersection or other GeoJSON-based filters).
   * @example {"geometry":{"type":"Polygon","coordinates":[[[-120.9,47.6],[-120.6,47.6],[-120.6,47.8],[-120.9,47.8],[-120.9,47.6]]]}}
   */
  body?: SearchBodyApiDto | null;
}

export interface PrintableDirectorySourceSummaryResponseDto {
  id: string;
  name: string;
  count: number;
}

export interface PrintableDirectorySourceResponseDto {
  id: string;
  order: number;
  type: "query" | "favorites_list" | "resource_ids";
  query?: PrintableDirectorySourceQueryResponseDto | null;
  favoriteList?: PrintableDirectorySourceSummaryResponseDto | null;
  resources: PrintableDirectorySourceSummaryResponseDto[];
}

export interface PrintableDirectorySectionResponseDto {
  id: string;
  order: number;
  headingLocalized: PrintableDirectoryLocalizedTextResponseDto;
  descriptionLocalized: PrintableDirectoryLocalizedTextResponseDto;
  /**
   * @min 1
   * @max 1000
   */
  maxResources: number;
  sources: PrintableDirectorySourceResponseDto[];
}

export interface PrintableDirectoryResponseDto {
  id: string;
  tenantId: string;
  ownerUserId: string;
  name: string;
  updatedBy?: string | null;
  /** Access config for tenant users: private (owner read/update), shared-read (others read, only owner updates), shared-edit (others can read and update). */
  accessPolicy: "private" | "shared-read" | "shared-edit";
  /**
   * Public, tenant-unique slug used for fully public preview sharing. Null if not set.
   * @example "winter-shelter-guide"
   */
  slug?: string | null;
  cover: PrintableDirectoryCoverResponseDto;
  header: PrintableDirectoryHeaderFooterResponseDto;
  footer: PrintableDirectoryHeaderFooterResponseDto;
  resourceLayout:
    | "line"
    | "summary"
    | "full"
    | "custom-search"
    | "custom-resource";
  /**
   * Enables booklet layout generation. When enabled, the brochure is formatted for booklet printing by ensuring the total page count is a multiple of four. If necessary, blank pages are inserted after the cover and before the back cover so that the cover remains the first page and the back cover remains the last page.
   * @default false
   */
  isBookletLayout: boolean;
  defaultQueryConfig?: PrintableDirectoryDefaultQueryConfigDto | null;
  sections: PrintableDirectorySectionResponseDto[];
  /** @example "2026-07-08T08:00:00.000Z" */
  createdAt: string;
  /** @example "2026-07-08T09:00:00.000Z" */
  updatedAt: string;
}

export interface PrintableDirectoryListResponseDto {
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
  items: PrintableDirectoryResponseDto[];
}

export interface CreatePrintableDirectoryDto {
  /** @example "My Printable Directory" */
  name: string;
  accessPolicy?: "private" | "shared-read" | "shared-edit";
  /**
   * Public, tenant-unique, URL-safe identifier used to share this directory's preview via a fully public link (`GET /printable-directories/public/:slug/preview`). Must be explicitly supplied by the client; it is never auto-generated. The slug acts as a capability token: anyone with the slug can resolve the preview, regardless of accessPolicy, so choose a non-guessable value for directories that should not be publicly discoverable.
   * @example "winter-shelter-guide"
   */
  slug?: string;
  resourceLayout?:
    | "line"
    | "summary"
    | "full"
    | "custom-search"
    | "custom-resource";
  /**
   * Enables booklet layout generation. When enabled, the brochure is formatted for booklet printing by ensuring the total page count is a multiple of four. If necessary, blank pages are inserted after the cover and before the back cover so that the cover remains the first page and the back cover remains the last page.
   * @default false
   */
  isBookletLayout?: boolean;
  defaultQueryConfig?: PrintableDirectoryDefaultQueryConfigDto | null;
}

export interface PrintableDirectoryLocalizedValuesDto {
  /**
   * Localized text map by locale key
   * @example {"en":"English copy","es":"Texto en español"}
   */
  values?: Record<string, string>;
}

export interface PrintableDirectoryCoverDto {
  titleLocalized?: PrintableDirectoryLocalizedValuesDto;
  descriptionLocalized?: PrintableDirectoryLocalizedValuesDto;
  /** @example "#0f172a" */
  primaryColor?: string;
  layoutType?: "default";
  /** @example "https://example.com/cover-front.jpg" */
  coverImageUrlFront?: string;
  /** @example "https://example.com/cover-back.jpg" */
  coverImageUrlBack?: string;
}

export interface PrintableDirectoryHeaderFooterDto {
  textLocalized?: PrintableDirectoryLocalizedValuesDto;
  /** @example ["logo","date"] */
  layout: ("text" | "logo" | "domain" | "date")[];
  /** @example "https://example.com/logo.svg" */
  logoUrl?: string;
}

export interface UpdatePrintableDirectoryDto {
  /** @example "My Printable Directory" */
  name?: string;
  accessPolicy?: "private" | "shared-read" | "shared-edit";
  /**
   * Public, tenant-unique, URL-safe identifier used to share this directory's preview via a fully public link (`GET /printable-directories/public/:slug/preview`). Must be explicitly supplied by the client; it is never auto-generated. The slug acts as a capability token: anyone with the slug can resolve the preview, regardless of accessPolicy, so choose a non-guessable value for directories that should not be publicly discoverable.
   * @example "winter-shelter-guide"
   */
  slug?: string;
  resourceLayout?:
    | "line"
    | "summary"
    | "full"
    | "custom-search"
    | "custom-resource";
  /**
   * Enables booklet layout generation. When enabled, the brochure is formatted for booklet printing by ensuring the total page count is a multiple of four. If necessary, blank pages are inserted after the cover and before the back cover so that the cover remains the first page and the back cover remains the last page.
   * @default false
   */
  isBookletLayout?: boolean;
  defaultQueryConfig?: PrintableDirectoryDefaultQueryConfigDto | null;
  cover?: PrintableDirectoryCoverDto;
  header?: PrintableDirectoryHeaderFooterDto;
  footer?: PrintableDirectoryHeaderFooterDto;
}

export interface PrintableDirectorySectionSourceDto {
  type: "query" | "favorites_list" | "resource_ids";
  query?: PrintableDirectorySourceQueryDto;
  /** @example "favorites-list-id" */
  favoritesListId?: string;
  /** @example ["resource-a","resource-b"] */
  resourceIds?: string[];
}

export interface CreatePrintableDirectorySectionDto {
  headingLocalized: PrintableDirectoryLocalizedValuesDto;
  descriptionLocalized: PrintableDirectoryLocalizedValuesDto;
  /**
   * @min 1
   * @max 1000
   * @default 100
   */
  maxResources?: number;
  sources?: PrintableDirectorySectionSourceDto[];
}

export interface ReorderPrintableDirectorySectionsDto {
  /** Ordered section IDs */
  sectionIds: string[];
}

export interface UpdatePrintableDirectorySectionDto {
  headingLocalized?: PrintableDirectoryLocalizedValuesDto;
  descriptionLocalized?: PrintableDirectoryLocalizedValuesDto;
  /**
   * @min 1
   * @max 1000
   * @default 100
   */
  maxResources?: number;
}

export interface ReorderPrintableDirectorySourcesDto {
  /** Ordered source IDs */
  sourceIds: string[];
}

export interface PrintableDirectoryPreviewSectionResourceDto {
  id: string;
  /**
   * Resolved printable-ready resource object from live resource data at preview time
   * @example {"_id":"00000000-0000-0000-0000-000000000000","serviceAtLocationId":"00000000-0000-0000-0000-000000000000","location":{"type":"Point","coordinates":[-106.0746,42.1485]},"addresses":[{"city":"Example","country":"United States","address_1":"543 East Connect Street","postalCode":"99032","stateProvince":"WA","rank":1,"type":"physical"}],"attribution":"Connect 211","createdAt":"2024-08-26T00:00:00","displayName":"FINANCIAL AND FOOD ASSISTANCE | EXAMPLE ORGANIZATION","displayPhoneNumber":"(555) 555-5555","email":"info@example.com","languages":["English","Spanish"],"lastAssuredDate":"2024-08-26T00:00:00","organizationName":"EXAMPLE ORGANIZATION","phoneNumbers":[{"number":"(555) 555-5555","rank":1,"type":"voice"},{"number":"(555) 555-5555","rank":2,"type":"fax"}],"serviceArea":{"type":"Polygon","coordinates":[[[-106.0746,42.1485],[-106.0746,42.1485],[-106.0746,42.1485],[-106.0746,42.1485],[-106.0746,42.1485],[-106.0746,42.1485],[-106.0746,42.1485],[-106.0746,42.1485]]],"description":["Washington"]},"tenant_id":"00000000-0000-0000-0000-000000000000","originalId":"1234","updatedAt":"2024-08-26T00:00:00","website":"https://www.example.com/","organizationUrl":"https://www.example.org/","translation":{"displayName":"FINANCIAL AND FOOD ASSISTANCE | EXAMPLE ORGANIZATION","fees":"n/a","hours":"Monday 11:00am - 4:30pm;Tuesday 11:00am - 6:00pm;Wednesday 11:00am - 4:30pm;Thursday 11:00am - 6:00pm","locale":"en","taxonomies":[{"code":"CW-0000.0000","name":"Rental Deposit Assistance"}],"serviceName":"FINANCIAL AND FOOD ASSISTANCE","eligibilities":"Rental Assistance is limited to families and individuals.","requiredDocuments":[],"applicationProcess":"Walk-In;Call","alert":"We are currently experiencing high call volumes. Please be patient and leave a message if you are unable to reach us.","serviceDescription":"Emergency financial assistance to help with:\n- Rental and utility assistance\n- Help with first month rent\n- Utility assistance \nFood Pantry including items\n- Fresh and Shelf-Stable Food\n- Personal hygiene items\n- Diapers\n- Prescriptions","organizationDescription":"We are a nonprofit community based volunteer organizations with goals to alleviate poverty and homelessness, encourage self-sufficiency, to allocate funds and resources efficiently, and to provide a \"hands-up\" to those in need.","languages":["English","Spanish"]},"facetsEn":[{"code":"Benton County","taxonomyName":"Area Served by County","termName":"Benton County"},{"code":"People with low income","taxonomyName":"Specialization","termName":"People with low income"}]}
   */
  resource: TransformedResourceOpenApiDto;
}

export interface PrintableDirectoryPreviewSectionDto {
  id: string;
  order: number;
  headingLocalized: PrintableDirectoryLocalizedTextResponseDto;
  descriptionLocalized: PrintableDirectoryLocalizedTextResponseDto;
  /**
   * @min 1
   * @max 1000
   */
  maxResources: number;
  sources: PrintableDirectorySourceResponseDto[];
  /** @example "Housing" */
  resolvedHeading: string;
  /** @example "English fallback text" */
  resolvedDescription: string;
  resources: PrintableDirectoryPreviewSectionResourceDto[];
}

export interface PrintableDirectoryPreviewResponseDto {
  id: string;
  tenantId: string;
  ownerUserId: string;
  name: string;
  updatedBy?: string | null;
  /** Access config for tenant users: private (owner read/update), shared-read (others read, only owner updates), shared-edit (others can read and update). */
  accessPolicy: "private" | "shared-read" | "shared-edit";
  /**
   * Public, tenant-unique slug used for fully public preview sharing. Null if not set.
   * @example "winter-shelter-guide"
   */
  slug?: string | null;
  cover: PrintableDirectoryCoverResponseDto;
  header: PrintableDirectoryHeaderFooterResponseDto;
  footer: PrintableDirectoryHeaderFooterResponseDto;
  resourceLayout:
    | "line"
    | "summary"
    | "full"
    | "custom-search"
    | "custom-resource";
  /**
   * Enables booklet layout generation. When enabled, the brochure is formatted for booklet printing by ensuring the total page count is a multiple of four. If necessary, blank pages are inserted after the cover and before the back cover so that the cover remains the first page and the back cover remains the last page.
   * @default false
   */
  isBookletLayout: boolean;
  defaultQueryConfig?: PrintableDirectoryDefaultQueryConfigDto | null;
  sections: PrintableDirectoryPreviewSectionDto[];
  /** @example "2026-07-08T08:00:00.000Z" */
  createdAt: string;
  /** @example "2026-07-08T09:00:00.000Z" */
  updatedAt: string;
  directoryId: string;
  locale: string;
  /** @example "2026-07-08T10:00:00.000Z" */
  generatedAt: string;
}

export interface OrganizationLocationDto {
  address_1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}

export interface OrganizationSearchSourceDto {
  organization_id: string;
  tenant_id: string;
  resource_writer_id: string;
  name: string;
  alternate_name: string | null;
  email: string | null;
  website: string | null;
  phone: string | null;
  location: OrganizationLocationDto | null;
}

export interface OrganizationSearchHitDto {
  _index: string;
  _id: string;
  _score: number | null;
  _source: OrganizationSearchSourceDto;
}

export interface OrganizationSearchResponseDto {
  took: number;
  timed_out: boolean;
  total: number;
  page: number;
  limit: number;
  hits: OrganizationSearchHitDto[];
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
   * Search query for taxonomy name or code
   * @default ""
   */
  query?: string;
  /**
   * Taxonomy code (deprecated, use query instead)
   * @deprecated
   */
  code?: string;
  /**
   * Page number for pagination
   * @default 1
   */
  page?: any;
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type TaxonomyControllerGetTaxonomiesV2Data = TaxonomyResponseDto;

export interface TaxonomyControllerGetTaxonomyTermsByCodeParams {
  /**
   * Taxonomy code(s) to look up. Can be a single code or comma-separated codes.
   * @example "NAICS-11"
   */
  terms?: any;
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type TaxonomyControllerGetTaxonomyTermsByCodeData = any;

export interface SearchControllerGetResourcesParams {
  /** @default "text" */
  query_type?: "text" | "taxonomy" | "more_like_this" | "hybrid";
  /** @default 1 */
  page?: any;
  /** Comma delimited list of longitude,latitude */
  coords?: string[];
  filters?: object;
  /** Comma-delimited HSIS taxonomy codes used as a hard scope for hybrid search (e.g. BM-1400,BM-1700) */
  taxonomy?: string | string[];
  /**
   * @min 0
   * @default 0
   */
  distance?: number;
  /**
   * Searcher age used to match minimum_age/service.maximum_age
   * @min 0
   */
  age?: number;
  /**
   * @min 25
   * @max 300
   * @default 25
   */
  limit?: number;
  geo_type?: "boundary" | "proximity";
  /**
   * Sort order: relevance (default), distance (requires coords), name (alphabetical by resource name), organization (alphabetical by provider name)
   * @default "relevance"
   */
  sort?: "relevance" | "distance" | "name" | "organization";
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type SearchControllerGetResourcesData = SearchResponseDto;

export interface SearchControllerGetResourcesPostPayload {
  /** GeoJSON geometry */
  geometry?: object;
}

export interface SearchControllerGetResourcesPostParams {
  /** @default "text" */
  query_type?: "text" | "taxonomy" | "more_like_this" | "hybrid";
  /** @default 1 */
  page?: any;
  /** Comma delimited list of longitude,latitude */
  coords?: string[];
  filters?: object;
  /** Comma-delimited HSIS taxonomy codes used as a hard scope for hybrid search (e.g. BM-1400,BM-1700) */
  taxonomy?: string | string[];
  /**
   * @min 0
   * @default 0
   */
  distance?: number;
  /**
   * Searcher age used to match minimum_age/maximum_age
   * @min 0
   */
  age?: number;
  /**
   * @min 25
   * @max 300
   * @default 25
   */
  limit?: number;
  geo_type?: "boundary" | "proximity";
  /**
   * Sort order: relevance (default), distance (requires coords), name (alphabetical by resource name), organization (alphabetical by provider name)
   * @default "relevance"
   */
  sort?: "relevance" | "distance" | "name" | "organization";
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
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
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
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
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type SearchControllerReRankNeedsClassificationData =
  AiSearchReRankResponseDto;

export interface ShortUrlControllerGetShortUrlByIdParams {
  id: string;
}

export type ShortUrlControllerGetShortUrlByIdData = any;

export type ShortUrlControllerGetOrCreateShortUrlData = any;

export type HealthControllerGetStatusData = any;

export interface FavoriteControllerCreateParams {
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type FavoriteControllerCreateData = any;

export interface FavoriteControllerRemoveParams {
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  favoriteId: string;
  favoriteListId: string;
}

export type FavoriteControllerRemoveData = any;

export interface FavoriteListControllerCreateParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

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
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type FavoriteListControllerFindAllData = FavoriteListResponseDto;

export interface FavoriteListControllerSyncLocalListParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

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
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type FavoriteListControllerSearchData = FavoriteListResponseDto;

export interface FavoriteListControllerFindOneParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type FavoriteListControllerFindOneData = FavoriteListDetailResponseDto;

export interface FavoriteListControllerUpdateParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type FavoriteListControllerUpdateData = any;

export interface FavoriteListControllerRemoveParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type FavoriteListControllerRemoveData = any;

export interface FavoriteListControllerPurgeParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type FavoriteListControllerPurgeData = any;

export interface ResourceControllerGetResourceByIdParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type ResourceControllerGetResourceByIdData =
  TransformedResourceOpenApiDto;

export interface ResourceControllerGetResourceByOriginalIdParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  /** Original Resource ID */
  id: string;
}

export type ResourceControllerGetResourceByOriginalIdData =
  TransformedResourceOpenApiDto;

export interface ResourceControllerGetResourceTitlesByIdsParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type ResourceControllerGetResourceTitlesByIdsData = any;

export interface ResourceControllerGetResourcesBatchParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type ResourceControllerGetResourcesBatchData = ResourceBatchResponseDto;

export interface SuggestionControllerGetTaxonomiesParams {
  /**
   * Search query for taxonomy name or code
   * @default ""
   */
  query?: string;
  /**
   * Taxonomy code filter
   * @deprecated
   */
  code?: string;
  /**
   * Page number for pagination
   * @default 1
   */
  page?: any;
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type SuggestionControllerGetTaxonomiesData = any;

export interface SuggestionControllerGetTaxonomyTermsByCodeParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

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

export interface AnalyticsControllerGetHeatmapParams {
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

export type AnalyticsControllerGetHeatmapData = HeatmapPointResponse[];

export interface AnalyticsControllerGetAreaSearchesParams {
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

export type AnalyticsControllerGetAreaSearchesData = AreaSearchesResponse;

export interface AnalyticsControllerGetEventValuesParams {
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
   * Umami event name (e.g. search_zero_results)
   * @example "search_zero_results"
   */
  event: string;
  /**
   * Property name to retrieve distinct values for
   * @example "query"
   */
  property: string;
}

export type AnalyticsControllerGetEventValuesData = EventValuesResponse[];

export type AnalyticsControllerGetEventCatalogData =
  EventCatalogEntryResponse[];

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

export interface PrintableDirectoryControllerListParams {
  /**
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  limit?: number;
  /** Name search */
  search?: string;
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type PrintableDirectoryControllerListData =
  PrintableDirectoryListResponseDto;

export interface PrintableDirectoryControllerCreateParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
}

export type PrintableDirectoryControllerCreateData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerGetByIdParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type PrintableDirectoryControllerGetByIdData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerUpdateParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type PrintableDirectoryControllerUpdateData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerRemoveParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export interface PrintableDirectoryControllerRemoveData {
  /** @example true */
  success?: boolean;
}

export interface PrintableDirectoryControllerCreateSectionParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type PrintableDirectoryControllerCreateSectionData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerReorderSectionsParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type PrintableDirectoryControllerReorderSectionsData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerUpdateSectionParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
  sectionId: string;
}

export type PrintableDirectoryControllerUpdateSectionData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerRemoveSectionParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
  sectionId: string;
}

export type PrintableDirectoryControllerRemoveSectionData =
  PrintableDirectoryResponseDto;

export type PrintableDirectoryControllerCreateSourcePayload =
  | {
      /** @example "query" */
      type: "query";
      query: {
        /** @example "Shelter search" */
        title?: string;
        /** @example {"query":"shelter","query_type":"text","page":1,"limit":25} */
        params: object;
      };
    }
  | {
      /** @example "favorites_list" */
      type: "favorites_list";
      /** @example "favorite-list-id" */
      favoritesListId: string;
    }
  | {
      /** @example "resource_ids" */
      type: "resource_ids";
      /**
       * @minItems 1
       * @example ["resource-1","resource-2"]
       */
      resourceIds: string[];
    };

export interface PrintableDirectoryControllerCreateSourceParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
  sectionId: string;
}

export type PrintableDirectoryControllerCreateSourceData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerReorderSourcesParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
  sectionId: string;
}

export type PrintableDirectoryControllerReorderSourcesData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerUpdateSourceParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
  sectionId: string;
  sourceId: string;
}

export type PrintableDirectoryControllerUpdateSourceData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerRemoveSourceParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
  sectionId: string;
  sourceId: string;
}

export type PrintableDirectoryControllerRemoveSourceData =
  PrintableDirectoryResponseDto;

export interface PrintableDirectoryControllerPreviewParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  id: string;
}

export type PrintableDirectoryControllerPreviewData =
  PrintableDirectoryPreviewResponseDto;

export interface PrintableDirectoryPublicControllerPreviewParams {
  /** Optional mirror of the resolved accept-language locale, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match the resolved accept-language value or the request is rejected with 400. */
  locale?: string;
  /** Optional mirror of the x-tenant-id header, used as a CDN cache-key workaround for edges that ignore Vary headers. If provided, must exactly match x-tenant-id or the request is rejected with 400. */
  tenant_id?: string;
  slug: string;
}

export type PrintableDirectoryPublicControllerPreviewData =
  PrintableDirectoryPreviewResponseDto;

export interface OrganizationControllerSearchParams {
  /**
   * @min 1
   * @max 50
   * @default 10
   */
  limit?: any;
  /**
   * @min 1
   * @default 1
   */
  page?: any;
  /** Organization name prefix or text for typeahead search */
  query: any;
}

export type OrganizationControllerSearchData = OrganizationSearchResponseDto;
