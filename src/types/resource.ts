import type {
  ForwardGeocodeResponseDto,
  ResourceAddressOpenApiDto,
  ResourceContactsOpenApiDto,
  ResourceFacetOpenApiDto,
  ResourcePhoneNumberOpenApiDto,
  ResourceQualityLinkOpenApiDto,
  ResourceTaxonomyOpenApiDto,
  ResourceTranslationOpenApiDto,
} from '@/lib/api/generated/data-contracts';

export type Taxonomy = ResourceTaxonomyOpenApiDto;

export type T = ResourceFacetOpenApiDto;

export interface Facet extends ResourceFacetOpenApiDto {
  _id?: string;
  taxonomyCode?: string;
  termCode?: string;
}

export interface FacetWithTranslation extends Facet {
  taxonomyNameEn?: string;
  termNameEn?: string;
}

export type Address = ResourceAddressOpenApiDto;
export type PhoneNumber = ResourcePhoneNumberOpenApiDto;
export type QualityLink = ResourceQualityLinkOpenApiDto;

export type BBox = [number, number, number, number];

export type GeocodeResult = ForwardGeocodeResponseDto;

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

export interface Resource {
  id: string;
  serviceAtLocationId: string | null;
  _id: string | null;
  originalId: string | null;
  tenantId: string | null;
  alert: string | null;
  alertDate?: string | null;
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
  translations?: ResourceTranslationOpenApiDto[];
  attributeValues?: Record<string, string> | null;
  linkQualityUrls: QualityLink[] | null;
  contacts: ResourceContactsOpenApiDto | null | undefined;
}
