import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { getDatabaseAdapter } from '@/lib/adapters/database/get-database-adapter';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  const dbAdapter = await getDatabaseAdapter();

  if (!session) {
    res.status(401);
    return;
  }

  if (req.method === 'GET') {
    try {
      const lists = await dbAdapter.findFavoriteLists(session);
      res.status(200).json(lists);
      return;
    } catch (err) {
      console.error(err);
      res.status(500);
      return;
    }
  }

  if (req.method === 'POST') {
    try {
      await dbAdapter.createFavoriteList(req.body, session);

      res.status(200);
      return;
    } catch (err) {
      console.error(err);
      res.status(500);
      return;
    }
  }

  res.status(404);
};

export default FavoriteListHandler;
