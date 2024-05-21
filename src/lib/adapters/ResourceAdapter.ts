import { BaseAdapter } from './BaseAdapter';
import dayjs from 'dayjs';

export interface IResource {
  id: string;
  serviceName: string;
  name: string;
  description: string;
  phone: string;
  website: string;
  address?: string;
  addresses: {
    type: string;
    address_1: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
  }[];
  phoneNumbers: {
    number: string;
    rank: number;
  }[];
  location: {
    coordinates: [number, number];
  };
  email: string;
  hours: string;
  languages: string[];
  applicationProcess: string;
  fees: string;
  requiredDocuments: string;
  eligibilities: string;
  serviceAreaDescription: string[];
  categories: { code: string; name: string }[];
  lastAssuredOn: string;
  organizationName: string;
  organizationDescription: string;
  serviceArea: any;
}

export class ResourceAdapter extends BaseAdapter {
  public async getResource(id: string): Promise<IResource> {
    const { data } = await this.axios.get(`/resource/${id}`);

    return {
      id: data._id,
      serviceName: data?.translation?.serviceName ?? null,
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
