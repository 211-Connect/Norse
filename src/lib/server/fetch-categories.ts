import qs from 'qs';
import { STRAPI_TOKEN, STRAPI_URL } from '../constants';
import { getLocale } from 'next-intl/server';
import { flattenAttributes } from '../../utils/flatten-attributes';
import { Category } from '@/types/category';
import { getTenantId } from './get-tenant-id';
import { unstable_cache } from 'next/cache';

const query = qs.stringify({
  populate: {
    category: {
      populate: ['list', 'list.subcategories', 'list.image', 'image'],
    },
  },
});

const getCachedCategories = unstable_cache(
  async (tenantId: string, locale: string) => {
    const response = await fetch(
      `${STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${tenantId}&${query}&locale=${locale}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      },
    );

    if (response.ok) {
      const { data } = await response.json();

      return {
        data: flattenAttributes(data[0])?.category?.list as Category[],
        error: null,
      };
    }

    throw new Error('Unable to get categories');
  },
  [],
  { revalidate: 15 * 60 },
);

export async function fetchCategories() {
  const [tenantId, locale] = await Promise.all([getTenantId(), getLocale()]);

  if (!tenantId) {
    return { data: null, error: 'Tenant id not set' };
  }

  try {
    const response = await getCachedCategories(tenantId, locale);
    return response;
  } catch (error) {
    return { data: null, error: 'Failed to fetch categories' };
  }
}
