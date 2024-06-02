import {
  Address,
  IResource,
  ServiceArea,
  Location,
  PhoneNumber,
} from '@/types/resource';
import { BaseDatabaseAdapter, Config } from './BaseDatabaseAdapter';
import { IRedirect } from '@/types/redirect';
import mongodb from '@/lib/mongodb';

export class MongoDatabaseAdapter extends BaseDatabaseAdapter {
  dbName = 'search_engine';

  async findResourceById(id: string, config: Config): Promise<IResource> {
    // Doing a raw query here so we can use projections
    const rawRecords: any = await mongodb.resource.findRaw({
      filter: {
        _id: id,
      },
      options: {
        limit: 1,
        projection: {
          noop: 0,
          translations: {
            $elemMatch: {
              locale: config.locale,
            },
          },
        },
      },
    });

    const record = rawRecords?.[0];

    if (!record) throw new Error(this.notFound);

    const translation = record?.translations?.[0];

    return {
      id: record._id.toString(),
      email: record?.email ?? null,
      phone:
        record?.displayPhoneNumber ??
        record?.phoneNumber?.find(
          (phone) => phone.type === 'voice' && phone.rank === 1,
        ) ??
        null,
      website: record?.website ?? null,
      addresses: (record?.addresses as Address[]) ?? null,
      phoneNumbers: (record?.phoneNumbers as PhoneNumber[]) ?? null,
      serviceArea: (record?.serviceArea as ServiceArea) ?? null,
      location: (record?.location as Location) ?? null,
      lastAssuredDate: record?.lastAssuredDate ?? null,
      createdAt: record?.createdAt ?? null,
      name: translation?.displayName ?? null,
      description: translation?.serviceDescription ?? null,
      fees: translation?.fees ?? null,
      hours: translation?.hours ?? null,
      locale: translation?.locale ?? null,
      eligibilities: translation?.eligibilities ?? null,
      applicationProcess: translation?.applicationProcess ?? null,
      taxonomies: translation?.taxonomies ?? null,
      requiredDocuments: translation?.requiredDocuments ?? null,
      languages: translation?.languages ?? null,
      service: {
        name: translation?.serviceName ?? null,
      },
      organization: {
        name: translation?.organizationName ?? record?.organizationName ?? null,
        description: translation?.organizationDescription ?? null,
      },
    };
  }

  async findRedirectById(id: string): Promise<IRedirect> {
    const record = await mongodb.redirect.findFirst({ where: { id } });

    if (!record) throw new Error(this.notFound);

    return {
      id: record.id.toString(),
      oldId: record.id.toString(),
      newId: record.newId,
    };
  }
}
