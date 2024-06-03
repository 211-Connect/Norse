import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getSearchAdapter } from '@/lib/adapters/search/get-search-adapter';
import { SuggestConfig } from '@/lib/adapters/search/BaseSearchAdapter';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  const searchAdapter = await getSearchAdapter();

  if (!session) {
    res.status(401);
    return;
  }

  if (req.method === 'GET') {
    try {
      const data = await searchAdapter.suggest(req.query as SuggestConfig);
      res.status(200).json(data);
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
