import { STRAPI_TOKEN, STRAPI_URL } from '../constants';
import { flattenStrapiEntity } from '../../utils/flatten-strapi-entity';
import { Tenant } from '@/types/tenant';
import { unstable_cache } from 'next/cache';

const getCachedResponse = unstable_cache(async () => {
  const response = await fetch(
    `${STRAPI_URL}/api/tenants?fields=tenantId&fields=name&pagination[limit]=-1`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    },
  );

  if (response.ok) {
    const { data } = await response.json();

    const tenants = data.map(flattenStrapiEntity);

    return {
      data: tenants,
      error: null,
    };
  }

  throw new Error('Unable to fetch tenants');
});

export async function fetchTenants(): Promise<
  { data: null; error: string } | { data: Tenant[]; error: null }
> {
  try {
    const response = await getCachedResponse();
    return response;
  } catch (error) {
    return { data: null, error: 'Unable to fetch tenants' };
  }
}
