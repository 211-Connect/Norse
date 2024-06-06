import { NextApiHandler } from 'next';
import { getSearchAdapter } from '@/lib/adapters/search/get-search-adapter';
import { SuggestConfig } from '@/lib/adapters/search/BaseSearchAdapter';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const searchAdapter = await getSearchAdapter();

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
