import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';

export class TaxonomyService {
  static endpoint = 'taxonomy';

  static readonly taxonomyCodeRegexp =
    /^[a-zA-Z]{1,2}(-\d{1,4}([.-]\d{1,4}){0,3})?$/i;

  static isTaxonomyCode(code: string): boolean {
    if (!code || typeof code !== 'string') return false;
    return this.taxonomyCodeRegexp.test(code);
  }

  static async getTaxonomies(
    searchTerm: string,
    options: { locale: string; tenantId?: string },
  ) {
    const searchParams = new URLSearchParams({
      locale: options.locale,
      query: searchTerm,
    });

    if (options.tenantId) {
      searchParams.append('tenant_id', options.tenantId);
    }

    const data = await fetchWrapper(
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
      data?.hits?.hits?.map((hit: any) => ({
        id: hit?._id,
        code: hit?._source?.code,
        name: hit?._source?.name,
      })) ?? []
    );
  }
}
