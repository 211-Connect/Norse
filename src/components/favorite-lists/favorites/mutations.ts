import FavoriteAdapter from '@/lib/client/adapters/favorite-adapter';
import { atomWithMutation, queryClientAtom } from 'jotai-tanstack-query';
import { IFavoriteListWithFavorites } from './types/Favorite';
import router from 'next/router';

export const updateFavoriteListMutation = atomWithMutation((get) => ({
  mutationKey: [
    'favorite',
    'lists',
    typeof window !== 'undefined' ? router.query.id : '',
  ],
  mutationFn: async ({
    _id,
    name,
    description,
    privacy,
  }: Partial<IFavoriteListWithFavorites>) => {
    const favoriteAdapter = FavoriteAdapter();
    const queryClient = get(queryClientAtom);

    const currentList = queryClient.getQueryData([
      'favorite',
      'lists',
      typeof window !== 'undefined' ? router.query.id : '',
    ]) as IFavoriteListWithFavorites;
    queryClient.setQueryData(
      [
        'favorite',
        'lists',
        typeof window !== 'undefined' ? router.query.id : '',
      ],
      {
        ...currentList,
        name,
        description,
        privacy,
      }
    );

    const data = await favoriteAdapter.updateFavoriteList({
      _id,
      name,
      description,
      privacy,
    });
    queryClient.invalidateQueries({
      queryKey: [
        'favorite',
        'lists',
        typeof window !== 'undefined' ? router.query.id : '',
      ],
    });
    return data;
  },
}));

export const deleteFavoriteFromFavoriteListMutation = atomWithMutation(
  (get) => ({
    mutationKey: [
      'favorite',
      typeof window !== 'undefined' ? router.query.id : '',
    ],
    mutationFn: async ({
      resourceId,
      favoriteListId,
    }: {
      resourceId: string;
      favoriteListId: string;
    }) => {
      const favoriteAdapter = FavoriteAdapter();
      const queryClient = get(queryClientAtom);

      const currentList: IFavoriteListWithFavorites = queryClient.getQueryData([
        'favorite',
        'lists',
        typeof window !== 'undefined' ? router.query.id : '',
      ]);
      queryClient.setQueryData(
        [
          'favorite',
          'lists',
          typeof window !== 'undefined' ? router.query.id : '',
        ],
        {
          ...currentList,
          favorites: currentList.favorites.filter(
            (item) => item._id !== resourceId
          ),
        }
      );

      const data = await favoriteAdapter.removeFavoriteFromList({
        favoriteListId: favoriteListId,
        resourceId: resourceId,
      });
      queryClient.invalidateQueries({
        queryKey: [
          'favorite',
          'lists',
          typeof window !== 'undefined' ? router.query.id : '',
        ],
      });
      return data;
    },
  })
);

export const deleteFavoriteListMutation = atomWithMutation((get) => ({
  mutationKey: [
    'favorite',
    'lists',
    typeof window !== 'undefined' ? router.query.id : '',
  ],
  mutationFn: async (_id: string) => {
    const favoriteAdapter = FavoriteAdapter();
    const queryClient = get(queryClientAtom);
    const data = await favoriteAdapter.deleteFavoriteList(_id);
    queryClient.invalidateQueries({ queryKey: ['favorite', 'lists'] });
    return data;
  },
}));
