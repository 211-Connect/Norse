import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import mongodb from '@/lib/mongodb';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'DELETE') {
    const favoriteList = await mongodb.favoriteList.findFirst({
      where: {
        id: req.query['list-id'] as string,
        ownerId: session.user.id,
      },
    });

    const newListOfFavorites = favoriteList?.favorites?.filter(
      (favorite) => favorite !== req.query['favorite-id'],
    );

    await mongodb.favoriteList.update({
      where: {
        id: req.query['list-id'] as string,
        ownerId: session.user.id,
      },
      data: {
        favorites: newListOfFavorites,
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
