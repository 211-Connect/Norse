import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { elasticsearch } from '@/lib/server/elasticsearch';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import z from 'zod';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  if (req.method === 'GET') {
    const QuerySchema = z.object({
      query: z.string().optional(),
      code: z.string().optional(),
      page: z.number().default(1),
      locale: z.string().default('en'),
    });

    const q = await QuerySchema.parseAsync(req.query);
    const skip = (q.page - 1) * 10;

    if (!q.query && !q.code) {
      throw new Error('Query or code is required');
    }

    const queryBuilder: SearchRequest = {
      index: `${process.env.ELASTICSEARCH_SUGGESTION_INDEX}_${q.locale}`,
      from: skip,
      size: 10,
      query: {
        bool: {
          filter: [],
        },
      },
      aggs: {},
    };

    if (q.query) {
      queryBuilder.query = {
        bool: {
          must: {
            multi_match: {
              query: q.query,
              type: 'bool_prefix',
              fields: ['name', 'name._2gram', 'name._3gram'],
            },
          },
          filter: [],
        },
      };
    } else if (q.code) {
      queryBuilder.query = {
        bool: {
          must: {
            multi_match: {
              query: q.code,
              type: 'bool_prefix',
              fields: ['code', 'code._2gram', 'code._3gram'],
            },
          },
          filter: [],
        },
      };
    }

    const data = await elasticsearch.search(queryBuilder);

    res.status(200).json(data);
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
