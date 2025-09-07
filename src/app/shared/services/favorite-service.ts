import { API_URL } from '../lib/constants';
import { createAxiosWithAuth } from '../lib/axiosWithAuth';
import { cache } from 'react';

const listEndpoint = 'favorite-list';
const baseEndpoint = 'favorite';

const getFavoriteList = cache(
  async (id: string | string[], locale: string, sessionId?: string) => {
    try {
      const { data } = await createAxiosWithAuth({ sessionId }).get(
        `${API_URL}/${listEndpoint}/${id}`,
        {
          headers: {
            'accept-language': locale,
            'x-api-version': '1',
          },
          params: {
            locale,
          },
        },
      );

      return data;
    } catch (err) {
      return {};
    }
  },
);

const getFavoriteLists = cache(async (sessionId?: string) => {
  try {
    const { data } = await createAxiosWithAuth({ sessionId }).get(
      `${API_URL}/${listEndpoint}`,
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    console.error('Error fetching favorite lists:', err);
    return [];
  }
});

const searchFavoriteLists = cache(
  async (searchText: string, sessionId?: string) => {
    try {
      const { data } = await createAxiosWithAuth({ sessionId }).get(
        `${API_URL}/${listEndpoint}/search`,
        {
          params: {
            name: searchText,
          },
          headers: {
            'x-api-version': '1',
          },
        },
      );

      return data;
    } catch (err) {
      console.error('Error searching favorite lists:', err);
      return [];
    }
  },
);

const updateFavoriteList = async (
  {
    id,
    name,
    description,
    privacy,
  }: {
    id: string;
    name: string;
    description?: string;
    privacy: boolean;
  },
  sessionId?: string,
) => {
  try {
    const { data } = await createAxiosWithAuth({ sessionId }).put(
      `${API_URL}/${listEndpoint}/${id}`,
      {
        name,
        description,
        public: privacy,
      },
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    return null;
  }
};

const deleteFavoriteList = async (id: string, sessionId?: string) => {
  try {
    const { data } = await createAxiosWithAuth({ sessionId }).delete(
      `${API_URL}/${listEndpoint}/${id}`,
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    return null;
  }
};

const createFavoriteList = async (
  {
    name,
    description,
    privacy,
  }: {
    name: string;
    description?: string;
    privacy: boolean;
  },
  sessionId?: string,
) => {
  try {
    const { data } = await createAxiosWithAuth({ sessionId }).post(
      `${API_URL}/${listEndpoint}`,
      {
        name,
        description,
        public: privacy,
      },
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const addToFavoriteList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  sessionId?: string,
) => {
  try {
    const { data } = await createAxiosWithAuth({ sessionId }).post(
      `${API_URL}/${baseEndpoint}`,
      {
        resourceId: resourceId,
        favoriteListId: favoriteListId,
      },
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    return null;
  }
};

const removeFavoriteFromList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  sessionId?: string,
) => {
  try {
    const { data } = await createAxiosWithAuth({ sessionId }).delete(
      `${API_URL}/${baseEndpoint}/${resourceId}/${favoriteListId}`,
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    return null;
  }
};

export {
  getFavoriteList,
  getFavoriteLists,
  searchFavoriteLists,
  updateFavoriteList,
  deleteFavoriteList,
  createFavoriteList,
  addToFavoriteList,
  removeFavoriteFromList,
};
