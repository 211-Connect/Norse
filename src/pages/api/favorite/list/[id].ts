import clientPromise from '@/lib/server/mongodb';
import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

const dbName = 'search_engine';
const collectionName = 'favoriteLists';
const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    const mongo = await clientPromise;
    const locale = req.headers['accept-language'];

    const aggregate = await mongo
      .db(dbName)
      .collection(collectionName)
      .aggregate([
        {
          $match: { _id: new ObjectId(req.query.id as string) },
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
      ])
      .toArray();

    const record = aggregate.length > 0 ? aggregate[0] : null;

    if (record.privacy === 'PRIVATE' && record.ownerId !== session.user.id) {
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }

    res.status(200).json(record);
    return;
  }

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'DELETE') {
    const mongo = await clientPromise;

    await mongo
      .db(dbName)
      .collection(collectionName)
      .deleteOne({
        _id: new ObjectId(req.query.id as string),
        ownerId: session.user.id,
      });

    res.status(200).json({ message: 'success' });
    return;
  } else if (req.method === 'PUT') {
    const UpdateFavoriteSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(2048).optional(),
      public: z.enum(['PUBLIC', 'PRIVATE']),
    });

    const body = await UpdateFavoriteSchema.parseAsync(req.body);
    const mongo = await clientPromise;

    await mongo
      .db(dbName)
      .collection(collectionName)
      .updateOne(
        {
          _id: new ObjectId(req.query.id as string),
          ownerId: session.user.id,
        },
        {
          $set: {
            name: body.name,
            description: body.description,
            privacy: body.public,
          },
        }
      );

    res.status(200).json({ message: 'success' });
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
