import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { cache } from 'react';

import { API_URL } from '../lib/constants';
import { createAxios } from '../lib/axios';

async function fetchAndTransformResource(
  url: string,
  options: { locale: string; tenantId?: string },
): Promise<any> {
  const headers = {
    'accept-language': options.locale,
    'x-api-version': '1',
  };
  const params = {
    locale: options.locale,
  };

  try {
    const { data } = await createAxios(options.tenantId).get(url, {
      headers: headers,
      params: params,
    });

    return {
      id: data._id,
      serviceName: data?.translation?.serviceName ?? null,
      attribution: data?.attribution ?? null,
      name: data?.translation?.displayName ?? data?.displayName ?? null,
      description: data?.translation?.serviceDescription ?? null,
      phone:
        data?.displayPhoneNumber ??
        data?.phoneNumbers?.find((p: any) => p.rank === 1 && p.type === 'voice')
          ?.number ??
        null,
      website: data?.website ?? null,
      address:
        data?.addresses?.find((a: any) => a.rank === 1)?.address_1 ?? null,
      addresses: data?.addresses ?? null,
      phoneNumbers:
        data?.translation?.phoneNumbers ?? data?.phoneNumbers ?? null,
      email: data?.email ?? null,
      hours: data?.translation?.hours ?? null,
      languages: data?.translation?.languages ?? null,
      interpretationServices: data?.translation?.interpretationServices ?? null,
      applicationProcess: data?.translation?.applicationProcess ?? null,
      fees: data?.translation?.fees,
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
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      // Concise logging for Axios errors
      console.error(
        `Error fetching resource: ${error.message}, Status Code: ${error.response?.status}, URL: ${url}`,
      );
    } else {
      // Fallback for non-Axios errors
      console.error('Error fetching resource:', error);
    }
    throw error;
  }
}

export const getResource = cache(
  (id: string, locale: string, tenantId?: string): Promise<any> => {
    const url = `${API_URL}/resource/${id}`;
    return fetchAndTransformResource(url, { locale, tenantId });
  },
);

export const getResourceByOriginalId = cache(
  (originalId: string, locale: string, tenantId?: string): Promise<any> => {
    const url = `${API_URL}/resource/original/${originalId}`;
    return fetchAndTransformResource(url, { locale, tenantId });
  },
);
