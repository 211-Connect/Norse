export interface Taxonomy {
  _id?: string;
  code: string;
  name: string;
}

export interface Facet {
  _id?: string;
  code: string;
  taxonomyName: string;
  taxonomyCode?: string;
  termName: string;
  termCode?: string;
}

export interface FacetWithTranslation extends Facet {
  taxonomyNameEn?: string;
  termNameEn?: string;
}

export interface Address {
  _id?: string;
  city: string;
  country: string;
  address_1: string;
  address_2?: string;
  postalCode: string;
  stateProvince: string;
  rank: number;
  type: string;
}

export interface PhoneNumber {
  _id?: string;
  number: string;
  rank: number;
  type: string;
  description?: string;
}

export interface QualityLink {
  url: string;
  displayText: string;
}

export type Coordinates = [number, number];

export type BBox = [number, number, number, number];

export interface GeocodeResult {
  type: 'coordinates' | 'invalid';
  address: string;
  coordinates: Coordinates;
  country?: string;
  district?: string;
  place?: string;
  postcode?: string;
  region?: string;
  place_type?: string[];
  bbox?: BBox;
}

export interface Location {
  type: 'Point';
  coordinates: number[];
}

export interface ServiceArea {
  _id?: string;
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][][] | number[][][];
  description?: string[];
}

export interface Translation {
  displayName: string;
  displaySummary?: string;
  fees?: string;
  hours?: string;
  hoursDescription?: string;
  locale: string;
  taxonomies: Taxonomy[];
  serviceName?: string;
  serviceDescription?: string;
  serviceSummary?: string;
  organizationDescription?: string;
  organizationSummary?: string;
  languages?: string[];
  interpretationServices?: string;
  applicationProcess?: string;
  requiredDocuments?: string[];
  eligibilities?: string;
  serviceAreaDescription?: string;
  phoneNumbers?: PhoneNumber[];
  transportation?: string;
  accessibility?: string;
  facets?: Facet[];
  attributeValues?: Record<string, string>;
  linkQualityUrls?: QualityLink[];
  locationSummary?: string;
  contacts: Array<{
    id: string;
    name: string;
    title?: string;
    email?: string;
    phones?: PhoneNumber[];
    priority: number;
  }>;
}

export interface ApiResource {
  _id: string;
  location?: Location;
  locationName?: string;
  addresses?: Address[];
  address?: string;
  attribution?: string;
  createdAt?: string | null;
  displayName: string;
  displayPhoneNumber?: string;
  phone?: string;
  email?: string | null;
  languages?: string[];
  lastAssuredDate?: string;
  organizationName?: string;
  phoneNumbers?: PhoneNumber[];
  serviceArea?: ServiceArea;
  serviceAreaName?: string;
  tenant_id?: string;
  originalId?: string | null;
  updatedAt?: string | null;
  website?: string;
  organizationUrl?: string;
  translation?: Translation;
  translations?: Translation[];
  facetsEn?: Facet[];
}

export interface ApiResourceBatchError {
  id: string;
  reason: string;
  statusCode: number;
}

export interface ApiResourceBatchResponse {
  data: Record<string, ApiResource>;
  errors: ApiResourceBatchError[];
  meta: {
    requested: number;
    successful: number;
    failed: number;
  };
}

export interface Resource {
  id: string;
  originalId: string | null;
  tenantId: string | null;
  serviceName: string | null;
  attribution: string | null;
  name: string | null;
  locationName: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  addresses: Address[] | null;
  phoneNumbers: PhoneNumber[] | null;
  email: string | null;
  hours: string | null;
  hoursDescription: string | null;
  languages: string[] | null;
  interpretationServices: string | null;
  applicationProcess: string | null;
  fees: string | null;
  requiredDocuments: string[] | null;
  eligibilities: string | null;
  serviceAreaDescription: string | null;
  serviceAreaName: string | null;
  categories: Taxonomy[] | null;
  lastAssuredOn: string;
  location: {
    coordinates: number[];
  } | null;
  organizationName: string | null;
  organizationDescription: string | null;
  organizationUrl: string | null;
  serviceArea: ServiceArea | null;
  transportation: string | null;
  accessibility: string | null;
  facets: FacetWithTranslation[] | null | undefined;
  translations?: Translation[];
  attributeValues?: Record<string, string> | null;
  linkQualityUrls: QualityLink[] | null;
  contacts: Translation['contacts'] | null | undefined;
}
