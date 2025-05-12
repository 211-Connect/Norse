import qs from 'qs';
import { STRAPI_TOKEN, STRAPI_URL, TENANT_ID } from '../constants';
import { getLocale } from 'next-intl/server';
import { flattenAttributes } from './flatten-attributes';
import { Suggestion } from '@/types/suggestion';

const query = qs.stringify({
  populate: {
    suggestion: {
      populate: ['list'],
    },
  },
});

export async function getSuggestions() {
  const locale = await getLocale();
  const response = await fetch(
    `${STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${TENANT_ID}&${query}&locale=${locale}`,
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

  return { data: null, error: 'Failed to fetch suggestions' };
}
