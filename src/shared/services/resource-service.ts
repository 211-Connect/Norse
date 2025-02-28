import { API_URL } from '../lib/constants';
import dayjs from 'dayjs';
import { Axios } from '../lib/axios';
import { AxiosError } from 'axios';

export class ResourceService {
  static endpoint = 'resource';

  // Private helper function to fetch and transform the data
  private static async fetchAndTransformResource(
    url: string,
    options: { locale: string },
  ): Promise<any> {
    const headers = {
      'accept-language': options.locale,
      'x-api-version': '1',
    };
    const params = {
      locale: options.locale,
    };

    try {
      const { data } = await Axios.get(url, {
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
          data?.phoneNumbers?.find(
            (p: any) => p.rank === 1 && p.type === 'voice',
          )?.number ??
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
        applicationProcess: data?.translation?.applicationProcess ?? null,
        fees: data?.translation?.fees,
        requiredDocuments: data?.translation?.requiredDocuments ?? null,
        eligibilities: data?.translation?.eligibilities ?? null,
        serviceAreaDescription:
          data?.translation?.serviceAreaDescription ?? null,
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

  static async getResource(
    id: string,
    options: { locale: string },
  ): Promise<any> {
    const url = `${API_URL}/${this.endpoint}/${id}`;
    return this.fetchAndTransformResource(url, options);
  }

  static async getResourceByOriginalId(
    originalId: string,
    options: { locale: string },
  ): Promise<any> {
    const url = `${API_URL}/${this.endpoint}/original/${originalId}`;
    return this.fetchAndTransformResource(url, options);
  }
}
