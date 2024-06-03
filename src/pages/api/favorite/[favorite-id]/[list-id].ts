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

  if (req.method === 'DELETE') {
    try {
      await dbAdapter.removeResourceFromFavoriteList(req.query, session);
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
