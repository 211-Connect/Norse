import { API_URL, TENANT_ID } from '../lib/constants';
import { createAxiosWithAuth } from '../lib/axios';

export class FavoriteService {
  static listEndpoint = 'favorite-list';
  static baseEndpoint = 'favorite';

  static async getFavoriteList(id: string | string[], config) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).get(
        `${API_URL}/${this.listEndpoint}/${id}`,
        {
          params: {
            tenant_id: TENANT_ID,
          },
        },
      );

      return data;
    } catch (err) {
      return {};
    }
  }

  static async getFavoriteLists(config?: { ctx?: any }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).get(
        `${API_URL}/${this.listEndpoint}`,
        {
          params: {
            tenant_id: TENANT_ID,
          },
        },
      );

      return data;
    } catch (err) {
      return [];
    }
  }

  static async searchFavoriteLists(searchText: string, config?: { ctx?: any }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).get(
        `${API_URL}/${this.listEndpoint}/search`,
        {
          params: {
            tenant_id: TENANT_ID,
            name: searchText,
          },
        },
      );

      return data;
    } catch (err) {
      return [];
    }
  }

  static async updateFavoriteList({
    id,
    name,
    description,
    privacy,
    config,
  }: {
    id: string;
    name: string;
    description?: string;
    privacy: boolean;
    config?: { ctx?: any };
  }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).put(
        `${API_URL}/${this.listEndpoint}/${id}`,
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
    } catch (err) {
      return null;
    }
  }

  static async deleteFavoriteList(id: string, config?: { ctx?: any }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).delete(
        `${API_URL}/${this.listEndpoint}/${id}`,
        {
          params: {
            tenant_id: TENANT_ID,
          },
        },
      );

      return data;
    } catch (err) {
      return null;
    }
  }

  static async createFavoriteList({
    name,
    description,
    privacy,
    config,
  }: {
    name: string;
    description?: string;
    privacy: boolean;
    config?: { ctx?: any };
  }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).post(
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
    } catch (err) {
      console.log('ERRR');
      console.log(err);
      return null;
    }
  }

  static async addToFavoriteList({
    resourceId,
    favoriteListId,
    config,
  }: {
    resourceId: string;
    favoriteListId: string;
    config?: { ctx?: any };
  }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).post(
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
    } catch (err) {
      return null;
    }
  }

  static async removeFavoriteFromList({
    resourceId,
    favoriteListId,
    config,
  }: {
    resourceId: string;
    favoriteListId: string;
    config?: { ctx?: any };
  }) {
    try {
      const { data } = await createAxiosWithAuth(config?.ctx).delete(
        `${API_URL}/${this.baseEndpoint}/${resourceId}/${favoriteListId}`,
        {
          params: {
            tenant_id: TENANT_ID,
          },
        },
      );

      return data;
    } catch (err) {
      return null;
    }
  }
}
