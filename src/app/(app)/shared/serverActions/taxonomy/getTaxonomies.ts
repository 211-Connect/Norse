'use server';

import { createLogger } from '@/lib/logger';
import { isValidLocale } from '@/payload/i18n/locales';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

const log = createLogger('getTaxonomies');

interface TaxonomyTerm {
  id: string;
  code: string;
  name: string;
}

export async function getTaxonomies(
  searchTerm: string,
  options: { locale: string; tenantId?: string },
): Promise<TaxonomyTerm[]> {
  if (!isValidLocale(options.locale)) {
    log.warn(`Invalid locale provided to getTaxonomies: ${options?.locale}`);
    return [];
  }

  if (!searchTerm || typeof searchTerm !== 'string') {
    log.warn(`Invalid search term provided to getTaxonomies`);
    return [];
  }

  const searchParams = new URLSearchParams({
    locale: options.locale,
    query: searchTerm,
  });

  if (options.tenantId) {
    searchParams.append('tenant_id', options.tenantId);
  }

  try {
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
  } catch (error) {
    log.error(
      `Error fetching taxonomies: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return [];
  }
}
