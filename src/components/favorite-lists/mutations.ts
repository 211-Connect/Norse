import FavoriteAdapter from '@/lib/client/adapters/favorite-adapter';
import { atomWithMutation, queryClientAtom } from 'jotai-tanstack-query';
import { IFavoriteList } from './types/FavoriteList';

export const createFavoriteListMutation = atomWithMutation((get) => ({
  mutationKey: ['favorite', 'lists'],
  mutationFn: async ({
    name,
    description,
    privacy,
  }: Partial<IFavoriteList>) => {
    const favoriteAdapter = FavoriteAdapter();
    const queryClient = get(queryClientAtom);

    const currentLists = queryClient.getQueryData([
      'favorite',
      'lists',
    ]) as IFavoriteList[];
    const newLists = [
      ...currentLists,
      {
        _id: '000000000000000000000000',
        name: name,
        description: description,
        privacy: privacy,
      },
    ];
    queryClient.setQueryData(['favorite', 'lists'], newLists);

    const data = await favoriteAdapter.createFavoriteList({
      name,
      description,
      privacy: privacy,
    });
    queryClient.invalidateQueries({ queryKey: ['favorite', 'lists'] });
    return data;
  },
}));

export const updateFavoriteListMutation = atomWithMutation((get) => ({
  mutationKey: ['favorite', 'lists'],
  mutationFn: async ({ _id, name, description, privacy }: IFavoriteList) => {
    const favoriteAdapter = FavoriteAdapter();
    const queryClient = get(queryClientAtom);

    const currentLists = queryClient.getQueryData([
      'favorite',
      'lists',
    ]) as IFavoriteList[];
    const newLists = [...currentLists];
    const updatedIndex = newLists.findIndex((list) => list._id === _id);
    if (updatedIndex !== -1) {
      newLists[updatedIndex] = {
        ...newLists[updatedIndex],
        name,
        description,
        privacy: privacy,
      };
      queryClient.setQueryData(['favorite', 'lists'], newLists);
    }

    const data = await favoriteAdapter.updateFavoriteList({
      _id,
      name,
      description,
      privacy: privacy,
    });
    queryClient.invalidateQueries({ queryKey: ['favorite', 'lists'] });
    return data;
  },
}));

export const deleteFavoriteListMutation = atomWithMutation((get) => ({
  mutationKey: ['favorite', 'lists'],
  mutationFn: async (_id: string) => {
    const favoriteAdapter = FavoriteAdapter();
    const queryClient = get(queryClientAtom);

    const currentLists = queryClient.getQueryData([
      'favorite',
      'lists',
    ]) as IFavoriteList[];
    const newLists = currentLists.filter((list) => list._id !== _id);
    queryClient.setQueryData(['favorite', 'lists'], newLists);
    const data = await favoriteAdapter.deleteFavoriteList(_id);
    queryClient.invalidateQueries({ queryKey: ['favorite', 'lists'] });
    return data;
  },
}));
