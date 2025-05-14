import qs from 'qs';
import { STRAPI_TOKEN, STRAPI_URL } from '../constants';
import { getLocale } from 'next-intl/server';
import { flattenAttributes } from './flatten-attributes';
import { Category } from '@/types/category';
import { getTenantId } from './get-tenant-id';

const query = qs.stringify({
  populate: {
    category: {
      populate: ['list', 'list.subcategories', 'list.image', 'image'],
    },
  },
});

export async function fetchCategories() {
  const tenantId = await getTenantId();

  if (!tenantId) {
    return { data: null, error: 'Tenant id not set' };
  }

  const locale = await getLocale();
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

  return { data: null, error: 'Failed to fetch categories' };
}
