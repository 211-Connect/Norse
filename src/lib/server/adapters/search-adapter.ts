import z from 'zod';
import { elasticsearch } from '../../elasticsearch';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import fs from 'fs/promises';
import path from 'path';

export type SearchRecord = {
  _id: any;
  id: any;
  serviceName: string;
  name: string;
  description: string;
  phone: string;
  website: string;
  address: string;
  location: any;
};

export type SearchQueryParams = {
  query?: string;
  query_type?: string;
  page?: string;
  coords?: string;
  filters?: string;
  distance?: string;
  locale?: string;
};

export default function SearchAdapter(retryOnNoResults = true) {
  const fieldsToQuery = [
    'display_name',
    'service_name',
    'service_alternate_name',
    'service_description',
    'organization_name',
    'organization_alternate_name',
    'organization_description',
    'taxonomy_terms',
    'taxonomy_descriptions',
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
  });

  return {
    search: async (config: SearchQueryParams) => {
      const q = await QuerySchema.parseAsync(config);
      const skip = (q.page - 1) * 25;
      const aggs: any = {};
      let coords: string[] | null =
        typeof q.coords === 'string' ? q.coords.split(',') : q.coords;
      coords = coords instanceof Array && coords.length === 2 ? coords : null;

      let facets = [];
      try {
        const rawData = await fs.readFile(
          path.resolve(`./public/locales/${config.locale}/facets.json`),
        );
        const facetsRaw = JSON.parse(rawData.toString());
        facets = facetsRaw?.facets ?? [];
      } catch (err) {
        console.error('Unable to parse facets', err);
      }

      if (facets.length > 0) {
        facets.forEach((data) => {
          aggs[data.facet] = {
            terms: {
              field: `facets.${data.facet}.keyword`,
              size: 10,
            },
          };
        });
      }

      const queryBuilder: SearchRequest = {
        index: `${process.env.ELASTICSEARCH_RESOURCE_INDEX}_${q.locale}`,
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

      const data = await elasticsearch.search(queryBuilder);

      let formattedData =
        data?.hits?.hits?.map((hit: any) => {
          let mainAddress: string | null =
            `${hit._source.address_1}, ${hit._source.city}, ${hit._source.state}, ${hit._source.postal_code}`;

          if (mainAddress.includes('null')) {
            mainAddress = null;
          }

          return {
            _id: hit._id,
            id: hit?._source?.service_at_location_id ?? null,
            serviceName: hit?._source?.service_name ?? null,
            name: hit?._source?.display_name ?? null,
            description: hit?._source?.service_description ?? null,
            phone: hit?._source?.primary_phone ?? null,
            website: hit?._source?.primary_website ?? null,
            address: mainAddress,
            location: hit?._source?.location ?? null,
          };
        }) ?? [];

      // const resFacets: any = {};
      // if (facets.length > 0) {
      //   for (const item of facets) {
      //     resFacets[item.facet] = item.name;
      //   }
      // }

      let totalResults =
        typeof data?.hits?.total !== 'number'
          ? data?.hits?.total?.value ?? 0
          : data?.hits?.total ?? 0;

      let noResults = false;
      if (totalResults === 0) {
        noResults = true;

        if (retryOnNoResults) {
          const searchAdapter = SearchAdapter(false);
          const newData = await searchAdapter.search({
            ...config,
            query_type: 'more_like_this',
          });
          formattedData = newData.results;
          totalResults = newData.totalResults;
        }
      }

      return {
        results: formattedData as SearchRecord[],
        noResults,
        totalResults,
        page: q.page,
        facets: data?.aggregations ?? {},
      };
    },
  };
}
