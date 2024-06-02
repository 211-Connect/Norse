import { mongodb } from '@/lib/mongodb';
import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../../auth/[...nextauth]';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'GET') {
    const allFavoriteListsSchema = z.object({
      exclude: z.string().optional(),
      name: z.string().optional(),
    });

    const query = await allFavoriteListsSchema.parseAsync(req.query);

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

    res.status(200).json(lists);
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
