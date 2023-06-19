import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { Router } from 'express';
import z from 'zod';
import { ElasticClient } from '../lib/ElasticClient';
import { cacheControl } from '../lib/cacheControl';

const router = Router();

const QuerySchema = z.object({
  query: z.string(),
  page: z.number().default(1),
});

router.get('/', async (req, res) => {
  try {
    const q = await QuerySchema.parseAsync(req.query);
    const skip = (q.page - 1) * 10;
    const locale = req.headers['x-locale'] || 'en';

    const queryBuilder: SearchRequest = {
      index: `${req.tenant.tenantId}-taxonomies_v2_${locale}`,
      from: skip,
      size: 10,
      query: {
        bool: {
          filter: [],
        },
      },
      aggs: {},
    };

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

    const data = await ElasticClient.search(queryBuilder);

    cacheControl(res);
    res.json(data);
  } catch (err: any) {
    console.log(err);
    res.sendStatus(400);
  }
});

export default router;
