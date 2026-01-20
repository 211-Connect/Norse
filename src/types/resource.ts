export interface Taxonomy {
  _id?: string;
  code: string;
  name: string;
}

export interface Facet {
  _id?: string;
  code: string;
  taxonomyName: string;
  termName: string;
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
  fees?: string;
  hours?: string;
  locale: string;
  taxonomies: Taxonomy[];
  serviceName?: string;
  serviceDescription?: string;
  organizationDescription?: string;
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
}

export interface ApiResource {
  _id: string;
  location?: Location;
  addresses?: Address[];
  address?: string;
  attribution?: string;
  createdAt?: string;
  displayName: string;
  displayPhoneNumber?: string;
  phone?: string;
  email?: string;
  languages?: string[];
  lastAssuredDate?: string;
  organizationName?: string;
  phoneNumbers?: PhoneNumber[];
  serviceArea?: ServiceArea;
  serviceAreaName?: string;
  tenant_id?: string;
  originalId?: string;
  updatedAt?: string;
  website?: string;
  translation?: Translation;
  translations?: Translation[];
}

export interface Resource {
  id: string;
  originalId: string | null;
  tenantId: string | null;
  serviceName: string | null;
  attribution: string | null;
  name: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  addresses: Address[] | null;
  phoneNumbers: PhoneNumber[] | null;
  email: string | null;
  hours: string | null;
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
  };
  organizationName: string | null;
  organizationDescription: string | null;
  serviceArea: ServiceArea | null;
  transportation: string | null;
  accessibility: string | null;
  facets: Facet[] | null;
  translations?: Translation[];
}
