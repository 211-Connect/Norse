import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../auth/[...nextauth]';
import { mongodb } from '@/lib/mongodb';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'PUT') {
    const NewFavoriteSchema = z.object({
      resourceId: z.string(),
      favoriteListId: z.string(),
    });

    const body = await NewFavoriteSchema.parseAsync(req.body);

    const record = await mongodb.favoriteList.findFirst({
      where: {
        id: body.favoriteListId,
        ownerId: session.user.id,
      },
    });

    if (!record) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    const newList: string[] = record?.favorites ?? [];
    if (newList.includes(body.resourceId)) {
      // Using 409 Conflict here because the resource already exists in the list
      res.status(409).json({ message: 'Resource already exists in list' });
      return;
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

    res.status(200).json({ message: 'success' });
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
