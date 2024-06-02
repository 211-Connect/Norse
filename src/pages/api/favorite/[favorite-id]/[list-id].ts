import clientPromise from '@/lib/mongodb';
import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import z from 'zod';
import { authOptions } from '../../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

const dbName = 'search_engine';
const collectionName = 'favoriteLists';
const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'DELETE') {
    const mongo = await clientPromise;

    const favoriteList = await mongo
      .db(dbName)
      .collection(collectionName)
      .findOne({
        _id: new ObjectId(req.query['list-id'] as string),
        ownerId: session.user.id,
      });

    const newListOfFavorites = favoriteList?.favorites?.filter(
      (favorite) => favorite !== req.query['favorite-id'],
    );

    await mongo
      .db(dbName)
      .collection(collectionName)
      .updateOne(
        {
          _id: new ObjectId(req.query['list-id'] as string),
          ownerId: session.user.id,
        },
        {
          $set: {
            favorites: newListOfFavorites,
          },
        },
      );

    res.status(200).json({ message: 'success' });
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
