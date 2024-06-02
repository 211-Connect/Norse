import { Latitude, Longitude } from './resource';

export interface ISearchResponse {
  results: ISearchResult[];
  noResults: boolean;
  totalResults: number;
  page: number;
  facets: {};
}

export interface ISearchResult {
  id: string;
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  location?: {
    type: string;
    coordinates: [Longitude, Latitude];
  };
}
