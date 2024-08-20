import { API_URL, TENANT_ID } from '../lib/constants';
import { axiosWithAuth } from '../lib/axios';

export class FavoriteService {
  static listEndpoint = 'favorite-list';
  static baseEndpoint = 'favorite';

  static async searchFavoriteLists(searchText: string) {
    const { data } = await axiosWithAuth.get(
      `${API_URL}/${this.listEndpoint}/search`,
      {
        params: {
          tenant_id: TENANT_ID,
          name: searchText,
        },
      },
    );

    return data;
  }

  static async createFavoriteList({
    name,
    description,
    privacy,
  }: {
    name: string;
    description?: string;
    privacy: boolean;
  }) {
    const { data } = await axiosWithAuth.post(
      `${API_URL}/${this.listEndpoint}`,
      {
        name,
        description,
        public: privacy,
      },
      {
        params: {
          tenant_id: TENANT_ID,
        },
      },
    );

    return data;
  }

  static async addToFavoriteList({
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  }) {
    const { data } = await axiosWithAuth.post(
      `${API_URL}/${this.baseEndpoint}`,
      {
        resourceId: resourceId,
        favoriteListId: favoriteListId,
      },
      {
        params: {
          tenant_id: TENANT_ID,
        },
      },
    );

    return data;
  }
}
