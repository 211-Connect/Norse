import { atom } from 'jotai';

type FavoriteList = {
  _id: string;
  name: string;
  description: string;
  privacy: 'PRIVATE' | 'PUBLIC';
};

export const favoriteListsAtom = atom<FavoriteList[]>([]);
