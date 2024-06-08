export type Longitude = number;
export type Latitude = number;
export type AddressType = 'physical' | 'virtual' | 'mailing';
export type Address = {
  city: string;
  country: string;
  address_1: string;
  postalCode: string;
  state: string;
  rank: number;
  type: AddressType;
};
export type PhoneNumber = {
  number: string;
  type: string;
  rank: number;
};
export type Taxonomy = {
  code: string;
  name: string;
};
export type ServiceArea = {
  type: string;
  description: string;
  coordinates: [[[Longitude, Latitude]]];
};
export type Location = {
  type: string;
  coordinates: [Longitude, Latitude];
};

export interface IResource extends IResourceTranslation {
  id: string;
  email: string;
  phone: string;
  website: string;
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  serviceArea: ServiceArea;
  location: Location;
  lastAssuredDate: string;
  createdAt: string;
}

export interface IResourceTranslation {
  id: string;
  name: string;
  description: string;
  fees: string;
  hours: string;
  locale: string;
  eligibilities: string;
  applicationProcess: string;
  taxonomies: Taxonomy[];
  requiredDocuments: string[];
  languages: string[];
  organization: {
    name: string;
    description: string;
  };
  service: {
    name: string;
  };
}
