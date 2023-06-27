import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { Router } from 'express';
import z from 'zod';
import { ElasticClient } from '../lib/ElasticClient';
import { cacheControl } from '../lib/cacheControl';
import { logger } from '../lib/winston';

const router = Router();

const QuerySchema = z.object({
  query: z.string(),
  page: z.number().default(1),
  locale: z.string().default('en'),
  tenant_id: z.string().default(''),
});

router.get('/', async (req, res) => {
  try {
    const q = await QuerySchema.parseAsync(req.query);
    const skip = (q.page - 1) * 10;

    const queryBuilder: SearchRequest = {
      index: `${q.tenant_id}-taxonomies_v2_${q.locale}`,
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
  } catch (err) {
    logger.error('Taxonomy search error', err);
    res.sendStatus(400);
  }
});

export default router;
