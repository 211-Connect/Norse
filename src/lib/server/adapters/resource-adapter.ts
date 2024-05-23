import dayjs from 'dayjs';
import mongodb from '../mongodb';

export type Resource = {
  id: string;
  displayName?: string;
  displayPhoneNumber?: string;
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
};

export default function ResourceAdapter() {
  const dbName = 'search_engine';
  const collectionName = 'resources';

  return {
    getRecordById: async (id, options): Promise<Resource> => {
      const mongo = await mongodb;
      const collection = mongo.db(dbName).collection(collectionName);

      const record = await collection.findOne(
        {
          _id: id,
        },
        {
          projection: {
            noop: 0,
            translations: {
              $elemMatch: {
                locale: options.locale,
              },
            },
          },
        }
      );

      if (!record) throw new Error('404');

      return {
        id: record._id.toString(),
        serviceName: record?.translations?.[0]?.serviceName ?? null,
        name:
          record?.translations?.[0]?.displayName ?? record?.displayName ?? null,
        description: record?.translations?.[0]?.serviceDescription ?? null,
        phone:
          record?.displayPhoneNumber ??
          record?.phoneNumbers?.find(
            (p: any) => p.rank === 1 && p.type === 'voice'
          )?.number ??
          null,
        website: record?.website ?? null,
        address:
          record?.addresses?.find((a: any) => a.rank === 1)?.address_1 ?? null,
        addresses: record?.addresses ?? null,
        phoneNumbers: record?.phoneNumbers ?? null,
        email: record?.email ?? null,
        hours: record?.translations?.[0]?.hours ?? null,
        languages: record?.translations?.[0]?.languages ?? null,
        applicationProcess:
          record?.translations?.[0]?.applicationProcess ?? null,
        fees: record?.translations?.[0]?.fees,
        requiredDocuments: record?.translations?.[0]?.requiredDocuments ?? null,
        eligibilities: record?.translations?.[0]?.eligibilities ?? null,
        serviceAreaDescription:
          record?.serviceArea?.description?.join(', ') ?? null,
        categories: record?.translations?.[0]?.taxonomies ?? null,
        lastAssuredOn: record?.lastAssuredDate
          ? dayjs(record.lastAssuredDate).format('MM/DD/YYYY')
          : '',
        location: {
          coordinates: record?.location?.coordinates ?? [0, 0],
        },
        organizationName: record?.organizationName ?? null,
        organizationDescription:
          record?.translations?.[0]?.organizationDescription ?? null,
        serviceArea: record?.serviceArea ?? null,
      };
    },
    getRedirect: async (id) => {
      const mongo = await mongodb;
      const collection = mongo.db(dbName).collection('redirects');

      const record = await collection.findOne({ _id: id });

      return record;
    },
  };
}
