import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { NextApiHandler } from 'next';
import { cacheControl } from 'src/lib/server/cacheControl';
import { ElasticClient } from 'src/lib/server/elasticClient';
import z from 'zod';

const QuerySchema = z.object({
  query: z.string().optional(),
  code: z.string().optional(),
  page: z.number().default(1),
  locale: z.string().default('en'),
});

// Handles routing based on method
const Search: NextApiHandler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return await GET(req, res);
    default:
      res.statusCode = 404;
      res.send('Not found');
  }
};

const GET: NextApiHandler = async (req, res) => {
  try {
    const q = await QuerySchema.parseAsync(req.query);
    const skip = (q.page - 1) * 10;

    if (!q.query && !q.code) {
      throw new Error('Query or code is required');
    }

    const queryBuilder: SearchRequest = {
      index: process.env.ELASTIC_TAXONOMY_INDEX,
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

    const data = await ElasticClient.search(queryBuilder);

    cacheControl({ res } as any);
    res.json(data);
  } catch (err) {
    res.status(400);
    res.end();
  }
};

export default Search;
