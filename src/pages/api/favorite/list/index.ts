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
    const lists: any = await mongodb.favoriteList.findRaw({
      filter: { ownerId: session.user.id },
      options: {
        limit: 20,
        projection: { name: 1, description: 1, privacy: 1 },
      },
    });

    res
      .status(200)
      .json(lists?.map((list) => ({ ...list, _id: list._id['$oid'] })));
    return;
  } else if (req.method === 'POST') {
    const NewFavoriteSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(2048).optional(),
      public: z.enum(['PUBLIC', 'PRIVATE']),
    });

    const body = await NewFavoriteSchema.parseAsync(req.body);

    await mongodb.favoriteList.create({
      data: {
        name: body.name,
        description: body.description,
        privacy: body.public,
        ownerId: session.user.id,
      },
    });

    res.status(200).json({ message: 'success ' });
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
