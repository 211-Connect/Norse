import { ISearchResponse, ISearchResult } from '@/types/search-result';
import {
  BaseSearchAdapter,
  QueryConfig,
  SuggestConfig,
} from './BaseSearchAdapter';
import path from 'path';
import fs from 'fs/promises';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import elasticsearch from '@/lib/elasticsearch';

let cachedFacets = null;
export class ElasticsearchSearchAdapter extends BaseSearchAdapter {
  constructor(retryOnNoResults: boolean = true) {
    super();
    this.retryOnNoResults = retryOnNoResults;
  }

  retryOnNoResults: boolean;

  fieldsToQuery = [
    'display_name',
    'display_description',
    'service_name',
    'service_description',
    'organization_name',
    'organization_description',
    'taxonomy_terms',
    'taxonomy_descriptions',
  ];

  async search(config: QueryConfig): Promise<ISearchResponse> {
    const q = await this.queryConfigSchema.parseAsync(config);
    const skip = (q.page - 1) * 25;
    const aggs: any = {};
    let coords: string[] | null =
      typeof q.coords === 'string' ? q.coords.split(',') : q.coords;
    coords = coords instanceof Array && coords.length === 2 ? coords : null;

    let facets = [];
    if (!cachedFacets) {
      try {
        const rawData = await fs.readFile(
          path.resolve(`./public/locales/${config.locale}/facets.json`),
        );
        const facetsRaw = JSON.parse(rawData.toString());
        facets = facetsRaw?.facets ?? [];
        cachedFacets = facets;
      } catch (err) {
        console.error('Unable to parse facets', err);
      }
    }

    if (cachedFacets.length > 0) {
      cachedFacets.forEach((data) => {
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
              fields: this.fieldsToQuery,
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
                fields: this.fieldsToQuery,
                like: q.query,
                min_term_freq: 1,
                max_query_terms: 12,
              },
            },
          ],
          filter: [],
        },
      };
    } else {
      queryBuilder.query = {
        bool: {
          must: {
            match_all: {},
          },
          filter: [],
        },
      };
    }

    const filters = [];
    for (const key in q.filters) {
      console.log(key);

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

    let formattedData: ISearchResult[] =
      data?.hits?.hits?.map((hit: any) => {
        let mainAddress: string | null =
          `${hit._source.address_1}, ${hit._source.city}, ${hit._source.state}, ${hit._source.postal_code}`;

        if (mainAddress.includes('null')) {
          mainAddress = null;
        }

        return {
          id: hit._id,
          name: hit?._source?.display_name ?? null,
          description: hit?._source?.display_description ?? null,
          phone: hit?._source?.display_phone_number ?? null,
          website: hit?._source?.display_website ?? null,
          email: hit?._source?.display_email ?? null,
          address: mainAddress,
          service: {
            name: hit?._source?.service_name ?? null,
            description: hit?._source?.service_description ?? null,
          },
          location: {
            name: hit?._source?.location_name ?? null,
            description: hit?._source?.location_description ?? null,
            point: hit?._source?.location_coordinates ?? null,
          },
          organization: {
            name: hit?._source?.organization_name ?? null,
            description: hit?._source?.organization_description ?? null,
          },
        };
      }) ?? [];

    let totalResults =
      typeof data?.hits?.total !== 'number'
        ? data?.hits?.total?.value ?? 0
        : data?.hits?.total ?? 0;

    let noResults = false;
    if (totalResults === 0) {
      noResults = true;

      if (this.retryOnNoResults) {
        const searchAdapter = new ElasticsearchSearchAdapter(false);
        const newData = await searchAdapter.search({
          ...config,
          query_type: 'more_like_this',
        });
        formattedData = newData.results;
        totalResults = newData.totalResults;
      }
    }

    return {
      results: formattedData as ISearchResult[],
      totalResults,
      page: q.page,
      facets: data?.aggregations ?? {},
    };
  }

  async suggest(config: SuggestConfig) {
    const q = await this.suggestConfigSchema.parseAsync(config);
    const skip = (q.page - 1) * 10;

    if (!q.query && !q.code) {
      throw new Error('Query or code is required');
    }

    const queryBuilder: SearchRequest = {
      index: `${process.env.ELASTICSEARCH_SUGGESTION_INDEX}_${q.locale}`,
      from: skip,
      size: 10,
      query: {},
      aggs: {},
    };

    if (q.query) {
      queryBuilder.query = {
        multi_match: {
          query: q.query,
          operator: 'or',
          fields: ['name', 'name.autocomplete'],
          fuzziness: 2,
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

    return data.hits.hits.map((hit: any) => ({
      id: hit._id,
      name: hit._source.name,
      code: hit._source.code,
      description: hit._source.description,
      taxonomy: hit._source.taxonomy,
    }));
  }
}
