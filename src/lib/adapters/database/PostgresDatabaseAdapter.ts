import {
  Address,
  IResource,
  ServiceArea,
  Location,
  PhoneNumber,
  Taxonomy,
} from '@/types/resource';
import { BaseDatabaseAdapter, Config } from './BaseDatabaseAdapter';
import postgres from '@/lib/postgres';
import { IRedirect } from '@/types/redirect';
import { Session } from 'next-auth';

export class PostgresDatabaseAdapter extends BaseDatabaseAdapter {
  addResourceToFavoriteList(body: any, session: Session) {
    throw new Error('Method not implemented.');
  }
  findFavoriteListById(id: string, locale: string, session: Session) {
    throw new Error('Method not implemented.');
  }
  deleteFavoriteListById(id: string, session: Session) {
    throw new Error('Method not implemented.');
  }
  updateFavoriteListById(id: string, body: any, session: Session) {
    throw new Error('Method not implemented.');
  }
  searchForFavoriteLists(query: { [key: string]: any }, session: Session) {
    throw new Error('Method not implemented.');
  }
  findFavoriteLists(session: Session) {
    throw new Error('Method not implemented.');
  }
  createFavoriteList(body: any, session: Session) {
    throw new Error('Method not implemented.');
  }
  removeResourceFromFavoriteList(
    query: { [key: string]: any },
    session: Session,
  ) {
    throw new Error('Method not implemented.');
  }
  async findResourceById(id: string, config: Config): Promise<IResource> {
    const record = await postgres.resource.findUnique({
      where: {
        id: id,
      },
      include: {
        translations: {
          where: {
            locale: config.locale,
          },
        },
      },
    });

    if (!record) throw new Error(this.notFound);

    const translation = record?.translations?.[0];
    const organization = translation?.organization as {
      name?: string;
      description?: string;
    };

    return {
      id: record.id,
      email: record?.email ?? null,
      phone: record?.phone_number ?? null,
      website: record?.website ?? null,
      addresses: (record?.addresses as Address[]) ?? null,
      phoneNumbers: (record?.phone_numbers as PhoneNumber[]) ?? null,
      serviceArea: (record?.service_area as ServiceArea) ?? null,
      location: (record?.location as Location) ?? null,
      lastAssuredDate: record?.last_assured_date?.toISOString() ?? null,
      createdAt: record?.created_at?.toISOString() ?? null,
      name: translation?.name ?? null,
      description: translation?.description ?? null,
      fees: translation?.fees ?? null,
      hours: translation?.hours ?? null,
      locale: translation?.locale ?? null,
      eligibilities: translation?.eligibilities ?? null,
      applicationProcess: translation?.application_process ?? null,
      taxonomies: (translation?.taxonomies as Taxonomy[]) ?? null,
      requiredDocuments: (translation?.required_documents as string[]) ?? null,
      languages: (translation?.languages as string[]) ?? null,
      organization: {
        name: organization?.name ?? null,
        description: organization?.description ?? null,
      },
      service: {
        name: translation?.service_name ?? null,
      },
    };
  }

  async findRedirectById(id: string): Promise<IRedirect> {
    const record = await postgres.redirect.findUnique({
      where: {
        old_resource_id: id,
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      oldId: record.old_resource_id,
      newId: record.new_resource_id,
    };
  }
}
