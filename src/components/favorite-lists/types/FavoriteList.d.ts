export interface IFavoriteList {
  _id: string;
  name: string;
  description?: string;
  privacy: 'PUBLIC' | 'PRIVATE';
}
