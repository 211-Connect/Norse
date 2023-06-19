import qs from 'qs';
import { BaseAdapter } from './BaseAdapter';

export class FavoriteAdapter extends BaseAdapter {
  public async getFavoriteList(id: string | string[]) {
    const { data } = await this.axios.get(`/favorite-list/${id}`);

    return data;
  }

  public async getFavoriteLists() {
    const { data } = await this.axios.get('/favorite-list');

    return data;
  }

  public async createFavoriteList({
    name,
    description,
    privacy,
  }: {
    name: string;
    description?: string;
    privacy: boolean;
  }) {
    const { data } = await this.axios.post('/favorite-list', {
      name,
      description,
      privacy,
    });

    return data;
  }

  public async updateFavoriteList({
    id,
    name,
    description,
    privacy,
  }: {
    id: string;
    name: string;
    description?: string;
    privacy: boolean;
  }) {
    const { data } = await this.axios.put(`/favorite-list/${id}`, {
      name,
      description,
      public: privacy,
    });

    return data;
  }

  public async deleteFavoriteList(id: string) {
    const { data } = await this.axios.delete(`/favorite-list/${id}`);

    return data;
  }

  public async searchFavoriteLists({
    resourceId,
    textToSearchFor,
  }: {
    resourceId?: string;
    textToSearchFor?: string;
  }) {
    const query = qs.stringify({
      exclude: resourceId,
      name: textToSearchFor,
    });

    const { data } = await this.axios.get(`/favorite-list/search?${query}`);

    return data;
  }

  public async addToFavoriteList({
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  }) {
    const { data } = await this.axios.post('/favorite', {
      resourceId: resourceId,
      favoriteListId: favoriteListId,
    });

    return data;
  }

  public async removeFavoriteFromList({
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  }) {
    const { data } = await this.axios.delete(
      `/favorite/${resourceId}/${favoriteListId}`
    );

    return data;
  }
}
