import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { API_URL, COOKIE_TENANT_ID } from '../constants';
import { Taxonomy } from '@/types/taxonomy';

export async function fetchTaxonomyTerms(
  terms: string[],
): Promise<{ data: Taxonomy[]; error: null } | { data: null; error: string }> {
  const locale = await getLocale();
  const cookieStore = await cookies();
  const tenantId = cookieStore.get(COOKIE_TENANT_ID)?.value;

  if (!tenantId) {
    return { data: null, error: 'No tenant id' };
  }

  const response = await fetch(
    `${API_URL}/taxonomy/term?terms=${terms}&locale=${locale}&tenant_id=${tenantId}`,
    {
      method: 'GET',
      headers: {
        'accept-language': locale || 'en',
        'x-api-version': '1',
        'x-tenant-id': tenantId || '',
      },
    },
  );

  if (!response.ok) {
    return { data: null, error: 'Unable to fetch taxonomies' };
  }

  const json = await response.json();

  return {
    data:
      json?.hits.hits.map((hit: any) => ({
        id: hit._id,
        code: hit._source.code,
        name: hit._source.name,
      })) ?? [],
    error: null,
  };
}
