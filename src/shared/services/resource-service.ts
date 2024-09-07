import { API_URL } from '../lib/constants';
import dayjs from 'dayjs';
import { Axios } from '../lib/axios';

export class ResourceService {
  static endpoint = 'resource';

  static async getResource(id: string): Promise<any> {
    const { data } = await Axios.get(`${API_URL}/${this.endpoint}/${id}`);

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
      phoneNumbers: data?.phoneNumbers ?? null,
      email: data?.email ?? null,
      hours: data?.translation?.hours ?? null,
      languages: data?.translation?.languages ?? null,
      applicationProcess: data?.translation?.applicationProcess ?? null,
      fees: data?.translation?.fees,
      requiredDocuments: data?.translation?.requiredDocuments ?? null,
      eligibilities: data?.translation?.eligibilities ?? null,
      serviceAreaDescription:
        data?.serviceArea?.description?.join(', ') ?? null,
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
  }
}
