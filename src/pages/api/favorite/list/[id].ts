import { mongodb } from '@/lib/mongodb';
import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../../auth/[...nextauth]';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    const locale = req.headers['accept-language'];

    const aggregate: any = await mongodb.favoriteList.aggregateRaw({
      pipeline: [
        {
          $match: { _id: { $oid: req.query.id } },
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
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }

    res.status(200).json({ ...record, _id: record._id['$oid'] });
    return;
  }

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'DELETE') {
    await mongodb.favoriteList.delete({
      where: {
        id: req.query.id as string,
        ownerId: session.user.id,
      },
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

    await mongodb.favoriteList.update({
      where: {
        id: req.query.id as string,
        ownerId: session.user.id,
      },
      data: {
        name: body.name,
        description: body.description,
        privacy: body.public,
      },
    });

    res.status(200).json({ message: 'success' });
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
