export interface IFavorite {
  _id: string;
  addresses?: {
    address_1?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    rank?: number;
    stateProvince?: string;
    type?: 'physical' | 'postal' | 'virtual';
  }[];
  createdAt?: string;
  updatedAt?: string;
  displayName?: string;
  displayPhoneNumber?: string;
  email?: string;
  languages?: any[];
  lastAssuredDate?: string;
  location?: {
    type?: string;
    coordinates?: [number, number];
  };
  organizationName?: string;
  website?: string;
  translations?: {
    applicationProcess?: string;
    displayName?: string;
    eligibilities?: string;
    fees?: string;
    hours?: string;
    languages?: any[];
    locale?: string;
    organizationDescription?: string;
    requiredDocuments?: any[];
    serviceDescription?: string;
    serviceName?: string;
    taxonomies?: {
      code?: string;
      name?: string;
    }[];
  }[];
  [key: string]: any;
}

export interface IFavoriteListWithFavorites {
  _id: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  name: string;
  description: string;
  favorites: IFavorite[];
}
