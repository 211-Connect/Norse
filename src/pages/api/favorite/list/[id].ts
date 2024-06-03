import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { getDatabaseAdapter } from '@/lib/adapters/database/get-database-adapter';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  const dbAdapter = await getDatabaseAdapter();

  /* This goes BEFORE the session check below. In this case the session check has been moved
   inside of the adapter method. This is because there is a possibility for a list to be public
   in which case anyone, even not logged in users can view it.
   */
  if (req.method === 'GET') {
    try {
      const locale = req.headers['accept-language'];
      const record = await dbAdapter.findFavoriteListById(
        req.query.id as string,
        locale,
        session,
      );
      res.status(200).json(record);
      return;
    } catch (err) {
      if (err.code != null && err.message != null) {
        res.status(err.code).json({ message: err.message });
        return;
      }

      res.status(500);
      return;
    }
  }

  if (!session) {
    res.status(401);
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await dbAdapter.deleteFavoriteListById(req.query.id as string, session);
      res.status(200);
      return;
    } catch (err) {
      console.error(err);
      res.status(500);
      return;
    }
  }

  if (req.method === 'PUT') {
    try {
      await dbAdapter.updateFavoriteListById(
        req.query.id as string,
        req.body,
        session,
      );
      res.status(200).json({ message: 'success' });
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
