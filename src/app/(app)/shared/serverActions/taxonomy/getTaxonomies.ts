'use server';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

interface TaxonomyTerm {
  id: string;
  code: string;
  name: string;
}

export async function getTaxonomies(
  searchTerm: string,
  options: { locale: string; tenantId?: string },
): Promise<TaxonomyTerm[]> {
  const searchParams = new URLSearchParams({
    locale: options.locale,
    query: searchTerm,
  });

  if (options.tenantId) {
    searchParams.append('tenant_id', options.tenantId);
  }

  const data = await fetchWrapper(
    `${API_URL}/taxonomy?${searchParams.toString()}`,
    {
      headers: {
        'accept-language': options.locale,
        'x-api-version': '2',
        'x-api-key': INTERNAL_API_KEY || '',
        ...(options.tenantId && { 'x-tenant-id': options.tenantId }),
      },
      cache: 'no-store',
    },
  );

  return Array.isArray(data?.items) ? data.items : [];
}
