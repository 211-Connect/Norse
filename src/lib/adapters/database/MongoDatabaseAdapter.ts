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
import z from 'zod';
import { Session } from 'next-auth';

export class MongoDatabaseAdapter extends BaseDatabaseAdapter {
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
    const translation = record?.translations?.[0];
    if (!record || !translation) throw { message: 'Not found', code: 404 };

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

  async addResourceToFavoriteList(rawBody, session: Session) {
    const NewFavoriteSchema = z.object({
      resourceId: z.string(),
      favoriteListId: z.string(),
    });

    const body = await NewFavoriteSchema.parseAsync(rawBody);

    const record = await mongodb.favoriteList.findFirst({
      where: {
        id: body.favoriteListId,
        ownerId: session.user.id,
      },
    });

    if (!record) {
      throw { message: 'Not found', code: 404 };
    }

    const newList: string[] = record?.favorites ?? [];
    if (newList.includes(body.resourceId)) {
      throw { message: 'Resource already exists in list', code: 409 };
    } else {
      newList.push(body.resourceId);
    }

    await mongodb.favoriteList.update({
      where: {
        id: body.favoriteListId,
        ownerId: session.user.id,
      },
      data: {
        favorites: newList,
      },
    });
  }

  async findFavoriteListById(id: string, locale: string, session: Session) {
    const aggregate: any = await mongodb.favoriteList.aggregateRaw({
      pipeline: [
        {
          $match: { _id: { $oid: id } },
        },
        {
          $lookup: {
            from: 'resources',
            localField: 'favorites',
            foreignField: '_id',
            as: 'favorites',
          },
        },
        {
          $addFields: {
            favorites: {
              $map: {
                input: '$favorites',
                as: 'favorite',
                in: {
                  $mergeObjects: [
                    '$$favorite',
                    {
                      translations: {
                        $filter: {
                          input: '$$favorite.translations',
                          as: 'translation',
                          cond: { $eq: ['$$translation.locale', locale] },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    });

    const record = aggregate.length > 0 ? aggregate[0] : null;

    if (record.privacy === 'PRIVATE' && record.ownerId !== session.user.id) {
      throw { message: 'You must be logged in.', code: 401 };
    }

    return { ...record, _id: record._id['$oid'] };
  }

  async deleteFavoriteListById(id: string, session: Session) {
    await mongodb.favoriteList.delete({
      where: {
        id: id,
        ownerId: session.user.id,
      },
    });
  }

  async updateFavoriteListById(id: string, rawBody, session: Session) {
    const UpdateFavoriteSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(2048).optional(),
      public: z.enum(['PUBLIC', 'PRIVATE']),
    });

    const body = await UpdateFavoriteSchema.parseAsync(rawBody);

    await mongodb.favoriteList.update({
      where: {
        id: id,
        ownerId: session.user.id,
      },
      data: {
        name: body.name,
        description: body.description,
        privacy: body.public,
      },
    });
  }

  async searchForFavoriteLists(
    rawQuery: { [key: string]: any },
    session: Session,
  ) {
    const allFavoriteListsSchema = z.object({
      exclude: z.string().optional(),
      name: z.string().optional(),
    });

    const query = await allFavoriteListsSchema.parseAsync(rawQuery);

    const exclude = query.exclude ? query.exclude.split(',') : [];
    const mongoQuery: any = {
      ownerId: session.user.id,
      favorites: { $nin: exclude },
    };

    if (query.name) mongoQuery.name = { $regex: query.name, $options: 'i' };

    const lists = await mongodb.favoriteList.findRaw({
      filter: mongoQuery,
      options: {
        limit: 20,
        projection: { name: 1, description: 1, privacy: 1 },
      },
    });

    return lists;
  }

  async findFavoriteLists(session: Session) {
    const lists: any = await mongodb.favoriteList.findRaw({
      filter: { ownerId: session.user.id },
      options: {
        limit: 20,
        projection: { name: 1, description: 1, privacy: 1 },
      },
    });

    return lists?.map((list) => ({ ...list, _id: list._id['$oid'] }));
  }

  async createFavoriteList(rawBody, session: Session) {
    const NewFavoriteSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(2048).optional(),
      public: z.enum(['PUBLIC', 'PRIVATE']),
    });

    const body = await NewFavoriteSchema.parseAsync(rawBody);

    await mongodb.favoriteList.create({
      data: {
        name: body.name,
        description: body.description,
        privacy: body.public,
        ownerId: session.user.id,
      },
    });
  }

  async removeResourceFromFavoriteList(
    rawQuery: { [key: string]: any },
    session: Session,
  ) {
    const favoriteList = await mongodb.favoriteList.findFirst({
      where: {
        id: rawQuery['list-id'] as string,
        ownerId: session.user.id,
      },
    });

    const newListOfFavorites = favoriteList?.favorites?.filter(
      (favorite) => favorite !== rawQuery['favorite-id'],
    );

    await mongodb.favoriteList.update({
      where: {
        id: rawQuery['list-id'] as string,
        ownerId: session.user.id,
      },
      data: {
        favorites: newListOfFavorites,
      },
    });
  }
}
