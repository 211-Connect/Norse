import qs from 'qs';
import { STRAPI_TOKEN, STRAPI_URL } from '../constants';
import { getLocale } from 'next-intl/server';
import { flattenAttributes } from '../../utils/flatten-attributes';
import { Suggestion } from '@/types/suggestion';
import { getTenantId } from './get-tenant-id';
import { unstable_cache } from 'next/cache';

const query = qs.stringify({
  populate: {
    suggestion: {
      populate: ['list'],
    },
  },
});

const getCachedSuggestions = unstable_cache(
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
        data: flattenAttributes(data[0])?.suggestion?.list as Suggestion[],
        error: null,
      };
    }

    throw new Error('Unable to get suggestions');
  },
  [],
  { revalidate: 15 * 60 },
);

export async function fetchSuggestions() {
  const [tenantId, locale] = await Promise.all([getTenantId(), getLocale()]);

  if (!tenantId) {
    return { data: null, error: 'Tenant id not set' };
  }

  try {
    const response = await getCachedSuggestions(tenantId, locale);
    return response;
  } catch (error) {
    return { data: null, error: 'Failed to fetch suggestions' };
  }
}
