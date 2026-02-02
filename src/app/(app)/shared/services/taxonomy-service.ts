import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import {
  TaxonomyTerm,
  TaxonomySearchResponse,
  TaxonomyHit,
} from '@/types/taxonomy';

export class TaxonomyService {
  static endpoint = 'taxonomy';

  static taxonomyCodeRegexp = new RegExp(
    /^[a-zA-Z]{1,2}(-\d{1,4}(\.\d{1,4}){0,3})?$/i,
  );

  static isTaxonomyCode(code: string): boolean {
    return this.taxonomyCodeRegexp.test(code);
  }

  static async getTaxonomies(
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

    const data = await fetchWrapper<TaxonomySearchResponse>(
      `${API_URL}/${this.endpoint}?${searchParams.toString()}`,
      {
        headers: {
          'accept-language': options.locale,
          'x-api-version': '1',
          ...(options.tenantId && { 'x-tenant-id': options.tenantId }),
        },
        cache: 'no-store',
      },
    );

    return (
      data?.hits?.hits?.map((hit: TaxonomyHit) => ({
        id: hit._id ?? '',
        code: hit._source?.code ?? '',
        name: hit._source?.name ?? '',
      })) ?? []
    );
  }
}
