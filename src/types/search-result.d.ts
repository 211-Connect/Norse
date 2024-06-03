import { Latitude, Longitude } from './resource';

export interface ISearchResponse {
  results: ISearchResult[];
  totalResults: number;
  page: number;
  facets: {};
}

export interface ISearchResult {
  id: string;
  name?: string;
  description?: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  service?: {
    name?: string;
    description?: string;
  };
  location?: {
    name?: string;
    description?: string;
    point?: {
      type: string;
      coordinates: [Longitude, Latitude];
    };
  };
  organization?: {
    name?: string;
    description?: string;
  };
}
