import {
  Address,
  IResource,
  ServiceArea,
  Location,
  PhoneNumber,
} from '@/types/resource';
import { BaseDatabaseAdapter, Config } from './BaseDatabaseAdapter';
import clientPromise from '@/lib/mongodb';
import { IRedirect } from '@/types/redirect';

export class MongoDatabaseAdapter extends BaseDatabaseAdapter {
  dbName = 'search_engine';

  async findResourceById(id: string, config: Config): Promise<IResource> {
    const collectionName = 'resources';
    const mongo = await clientPromise;
    const collection = mongo.db(this.dbName).collection(collectionName);

    const record = await collection.findOne(
      {
        _id: id as any,
      },
      {
        projection: {
          noop: 0,
          translations: {
            $elemMatch: {
              locale: config.locale,
            },
          },
        },
      },
    );

    if (!record) throw new Error(this.notFound);

    const translation = record?.translations?.[0];

    return {
      id: record._id.toString(),
      email: record?.email ?? null,
      phoneNumber: record?.displayPhoneNumber ?? null,
      website: record?.website ?? null,
      addresses: (record?.addresses as Address[]) ?? null,
      phoneNumbers: (record?.phoneNumbers as PhoneNumber[]) ?? null,
      serviceArea: (record?.serviceArea as ServiceArea) ?? null,
      location: (record?.location as Location) ?? null,
      lastAssuredDate: record?.lastAssuredDate ?? null,
      createdAt: record?.createdAt ?? null,
      name: translation?.displayName ?? null,
      description: translation?.serviceDescription ?? null,
      serviceName: translation?.serviceName ?? null,
      fees: translation?.fees ?? null,
      hours: translation?.hours ?? null,
      locale: translation?.locale ?? null,
      eligibilities: translation?.eligibilities ?? null,
      applicationProcess: translation?.applicationProcess ?? null,
      taxonomies: translation?.taxonomies ?? null,
      requiredDocuments: translation?.requiredDocuments ?? null,
      languages: translation?.languages ?? null,
      organization: {
        name: record?.organizationName ?? null,
        description: translation?.organizationDescription ?? null,
      },
    };
  }

  async findRedirectById(id: string): Promise<IRedirect> {
    const collectionName = 'redirects';
    const mongo = await clientPromise;
    const collection = mongo.db(this.dbName).collection(collectionName);

    const record = await collection.findOne({ _id: id as any });

    if (!record) return null;

    return {
      id: record._id.toString(),
      oldId: record._id.toString(),
      newId: record.newId,
    };
  }
}
