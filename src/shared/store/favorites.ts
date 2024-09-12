import { atom } from 'jotai';

export type FavoriteList = {
  _id: string;
  name: string;
  description: string;
  privacy: 'PRIVATE' | 'PUBLIC';
};

export type Favorite = {
  _id: string;
  addresses: {
    _id: string;
    city: string;
    address_1: string;
    country: string;
    postalCode: string;
    rank: number;
    stateProvince: string;
    type: string;
  }[];
  attribution: string;
  email: string;
  website: string;
  displayPhoneNumber: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  phoneNumbers: {
    _id: string;
    number: string;
    rank: number;
    type: string;
  }[];
  translations: {
    applicationProcess: string;
    displayName: string;
    eligibilities: string;
    fees: string;
    hours: string;
    locale: string;
    languages: string[];
    organizationDescription: string;
    requiredDocuments: string[];
    serviceName: string;
    serviceDescription: string;
    taxonomies: {
      code: string;
      name: string;
    }[];
  }[];
};

export type FavoriteListWithFavorites = {
  _id: string;
  name: string;
  description: string;
  privacy: 'PRIVATE' | 'PUBLIC';
  viewingAsOwner: boolean;
  favorites: Favorite[];
};

export const favoriteListsAtom = atom<FavoriteList[]>([]);

export const favoriteListWithFavoritesAtom = atom<FavoriteListWithFavorites>({
  _id: '',
  name: '',
  description: '',
  privacy: 'PRIVATE',
  viewingAsOwner: false,
  favorites: [],
});
