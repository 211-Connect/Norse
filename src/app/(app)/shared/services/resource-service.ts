import dayjs from 'dayjs';

import { API_URL } from '../lib/constants';
import { createAxios } from '../lib/axios';
import { RedisCacheKey, withRedisCache } from '@/payload/utilities';
import { ApiResource, Resource } from '@/types/resource';

async function fetchAndTransformResource(
  url: string,
  options: { locale: string; tenantId?: string; cacheKey: RedisCacheKey },
): Promise<Resource | null> {
  return await withRedisCache(options.cacheKey, async () => {
    const headers = {
      'accept-language': options.locale,
      'x-api-version': '1',
    };
    const params = {
      locale: options.locale,
    };

    const { data } = await createAxios(options.tenantId).get<ApiResource>(url, {
      headers: headers,
      params: params,
    });

    return {
      id: data._id,
      originalId: data?.originalId ?? null,
      tenantId: data?.tenant_id ?? null,
      serviceName: data?.translation?.serviceName ?? null,
      attribution: data?.attribution ?? null,
      name: data?.translation?.displayName ?? data?.displayName ?? null,
      description: data?.translation?.serviceDescription ?? null,
      phone:
        data?.phone ??
        data?.displayPhoneNumber ??
        data?.phoneNumbers?.find((p) => p.rank === 1 && p.type === 'voice')
          ?.number ??
        null,
      website: data?.website ?? null,
      address:
        data?.address ??
        data?.addresses?.find((a) => a.rank === 1)?.address_1 ??
        null,
      addresses: data?.addresses ?? null,
      phoneNumbers:
        data?.translation?.phoneNumbers ?? data?.phoneNumbers ?? null,
      email: data?.email ?? null,
      hours: data?.translation?.hours ?? null,
      languages: data?.translation?.languages ?? null,
      interpretationServices: data?.translation?.interpretationServices ?? null,
      applicationProcess: data?.translation?.applicationProcess ?? null,
      fees: data?.translation?.fees ?? null,
      requiredDocuments: data?.translation?.requiredDocuments ?? null,
      eligibilities: data?.translation?.eligibilities ?? null,
      serviceAreaDescription: data?.translation?.serviceAreaDescription ?? null,
      serviceAreaName: data?.serviceAreaName ?? null,
      categories: data?.translation?.taxonomies ?? null,
      lastAssuredOn: data?.lastAssuredDate
        ? dayjs(data.lastAssuredDate).format('MM/DD/YYYY')
        : '',
      location: {
        coordinates: data?.location?.coordinates ?? [0, 0],
      },
      organizationName: data?.organizationName ?? null,
      organizationDescription:
        data?.translation?.organizationDescription ?? null,
      serviceArea: data?.serviceArea ?? null,
      transportation: data?.translation?.transportation ?? null,
      accessibility: data?.translation?.accessibility ?? null,
      facets: data?.translation?.facets ?? null,
    };
  });
}

export async function getResource(
  id: string,
  locale: string,
  tenantId?: string,
): Promise<Resource | null> {
  const url = `${API_URL}/resource/${id}`;
  return fetchAndTransformResource(url, {
    locale,
    tenantId,
    cacheKey: `resource:${id}:${locale}`,
  });
}

export async function getResourceByOriginalId(
  originalId: string,
  locale: string,
  tenantId?: string,
): Promise<Resource | null> {
  const url = `${API_URL}/resource/original/${originalId}`;
  return fetchAndTransformResource(url, {
    locale,
    tenantId,
    cacheKey: `resource:${originalId}:${locale}`,
  });
}
