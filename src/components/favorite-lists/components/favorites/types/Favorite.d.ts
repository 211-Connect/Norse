export interface IFavorite {
  [key: string]: string;
}

export interface IFavoriteListWithFavorites {
  _id: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  name: string;
  description: string;
  favorites: IFavorite[];
}
