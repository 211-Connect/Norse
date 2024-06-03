import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getDatabaseAdapter } from '@/lib/adapters/database/get-database-adapter';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  const dbAdapter = await getDatabaseAdapter();

  if (!session) {
    res.status(401);
    return;
  }

  if (req.method === 'PUT') {
    try {
      await dbAdapter.addResourceToFavoriteList(req.body, session);
    } catch (err) {
      if (err.code != null && err.message != null) {
        res.status(err.code).json({ message: err.message });
        return;
      }

      res.status(500);
      return;
    }

    res.status(200);
    return;
  }

  res.status(404);
};

export default FavoriteListHandler;
