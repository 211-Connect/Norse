import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { Router } from 'express';
import z, { string } from 'zod';
import { ElasticClient } from '../lib/ElasticClient';
import { cacheControl } from '../lib/cacheControl';
import { logger } from '../lib/winston';

const router = Router();

const fieldsToQuery = [
  'display_name',
  'service_name',
  'service_alternate_name',
  'service_description',
  'organization_name',
  'organization_alternate_name',
  'organization_description',
];

const QuerySchema = z.object({
  query: z.string().or(z.array(z.string())).default(''),
  query_type: z.string().default('text'),
  page: z
    .preprocess((v) => parseInt(v as string), z.number().positive())
    .default(1),
  coords: z.string().or(z.array(z.string())).default([]),
  filters: z.record(z.string().or(z.array(z.string()))).default({}),
  distance: z
    .preprocess((v) => parseInt(v as string), z.number().nonnegative())
    .default(0),
  locale: z.string().default('en'),
  tenant_id: z.string().default(''),
});
router.get('/', async (req, res) => {
  try {
    const q = await QuerySchema.parseAsync(req.query);
    const skip = (q.page - 1) * 25;
    const aggs: any = {};
    let coords: string[] | null =
      typeof q.coords === 'string' ? q.coords.split(',') : q.coords;
    coords = coords instanceof Array && coords.length === 2 ? coords : null;

    if (req.tenant.facets && req.tenant.facets instanceof Array) {
      // Get facets for faceted search for specific tenant
      req.tenant.facets?.forEach((data) => {
        aggs[data.facet] = {
          terms: {
            field: `facets.${data.facet}.keyword`,
            size: 10,
          },
        };
      });
    }

    const queryBuilder: SearchRequest = {
      index: `${q.tenant_id}-results_v2_${q.locale}`,
      from: skip,
      size: 25,
      _source_excludes: ['service_area'],
      query: {},
      sort: [],
      aggs,
    };

    if (
      q.query_type === 'text' &&
      q.query.length > 0 &&
      typeof q.query === 'string'
    ) {
      queryBuilder.query = {
        bool: {
          must: {
            multi_match: {
              query: q.query,
              analyzer: 'standard',
              operator: 'AND',
              fields: fieldsToQuery,
            },
          },
          filter: [],
        },
      };
    } else if (q.query_type === 'text' && q.query.length === 0) {
      queryBuilder.query = {
        bool: {
          must: {
            match_all: {},
          },
          filter: [],
        },
      };
    } else if (q.query_type === 'taxonomy') {
      q.query = typeof q.query === 'string' ? q.query.split(',') : q.query;

      queryBuilder.query = {
        bool: {
          should:
            q.query instanceof Array
              ? q.query.map((el: any) => ({
                  match_phrase_prefix: {
                    taxonomy_codes: {
                      query: el,
                    },
                  },
                }))
              : {
                  match_phrase_prefix: {
                    taxonomy_codes: {
                      query: q.query,
                    },
                  },
                },
          filter: [],
          minimum_should_match: 1,
        },
      };

      console.log(queryBuilder.query);
    } else if (q.query_type === 'more_like_this') {
      queryBuilder.query = {
        bool: {
          must: [
            {
              more_like_this: {
                fields: fieldsToQuery,
                like: q.query,
                min_term_freq: 1,
                max_query_terms: 12,
              },
            },
          ],
          filter: [],
        },
      };
    }

    const filters = [];
    for (const key in q.filters) {
      if (q.filters[key] instanceof Array) {
        for (const item of q.filters[key]) {
          filters.push({
            term: {
              [`facets.${key}.keyword`]: item,
            },
          });
        }
      } else {
        filters.push({
          term: {
            [`facets.${key}.keyword`]: q.filters[key],
          },
        });
      }
    }

    if (coords) {
      filters.push({
        geo_shape: {
          service_area: {
            shape: {
              type: 'point',
              coordinates: [parseFloat(coords[0]), parseFloat(coords[1])],
            },
            relation: 'intersects',
          },
        },
      });

      // Sort by distance
      queryBuilder.sort = [
        {
          _geo_distance: {
            location: {
              lon: parseFloat(coords[0]),
              lat: parseFloat(coords[1]),
            },
            order: 'asc',
            unit: 'm',
            mode: 'min',
          },
        },
      ];

      // If distance is greater than 0, apply geo_distance filter
      if (q.distance > 0) {
        filters.push({
          geo_distance: {
            distance: `${q.distance}miles`,
            location: {
              lon: parseFloat(coords[0]),
              lat: parseFloat(coords[1]),
            },
          },
        });
      }
    }

    if (queryBuilder.query?.bool?.filter) {
      queryBuilder.query.bool.filter = filters;
    }

    const data = await ElasticClient.search(queryBuilder);

    const facets: any = {};
    if (req.tenant.facets && req.tenant.facets instanceof Array) {
      for (const item of req.tenant.facets) {
        facets[item.facet] = item.name;
      }
    }

    cacheControl(res);
    res.json({ search: data, facets });

    // Log search data
    logger.log({
      level: 'search',
      message: 'search query',
      sessionId: req.headers['x-session-id'],
      tenantId: req.tenant.tenantId,
      search: {
        type: q.query_type,
        query: q.query_type === 'text' ? q.query : null,
        taxonomies: q.query_type === 'taxonomy' ? q.query : null,
        total:
          typeof data?.hits?.total !== 'number'
            ? data?.hits?.total?.value ?? 0
            : data?.hits?.total ?? 0,
        facets: q.filters,
        location:
          typeof q.coords === 'string' && q.coords.length > 0
            ? {
                type: 'point',
                coordinates: q.coords.split(',').map((el) => parseFloat(el)),
              }
            : null,
        distance: q?.distance ?? null,
      },
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

export default router;
