import { IFavoriteList } from '@/components/favorite-lists/types/FavoriteList';
import axios from 'axios';
import router from 'next/router';

export default function FavoriteAdapter() {
  return {
    getFavoriteLists: async (): Promise<IFavoriteList[]> => {
      const { data } = await axios.get('/api/favorite/list');
      return data;
    },
    getFavoriteListById: async (id: string) => {
      if (!id || id.length === 0) return;
      const { data } = await axios.get(`/api/favorite/list/${id}`, {
        headers: {
          'Accept-Language': router.locale,
        },
      });
      return data;
    },
    removeFavoriteFromList: async ({
      resourceId,
      favoriteListId,
    }: {
      resourceId: string;
      favoriteListId: string;
    }) => {
      const { data } = await axios.delete(
        `/api/favorite/${resourceId}/${favoriteListId}`
      );

      return data;
    },
    createFavoriteList: async ({
      name,
      description,
      privacy,
    }: Partial<IFavoriteList>) => {
      const { data } = await axios.post('/api/favorite/list', {
        name,
        description,
        public: privacy,
      });

      return data;
    },
    updateFavoriteList: async ({
      _id,
      name,
      description,
      privacy,
    }: IFavoriteList) => {
      const { data } = await axios.put(`/api/favorite/list/${_id}`, {
        name,
        description,
        public: privacy,
      });

      return data;
    },
    deleteFavoriteList: async (id: string) => {
      const { data } = await axios.delete(`/api/favorite/list/${id}`);
      return data;
    },
  };
}
