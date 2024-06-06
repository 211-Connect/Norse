import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import elasticsearch from '.';
import { Client } from '@elastic/elasticsearch';
import { concat, forOwn, isArray, isObject, merge } from 'lodash';

export class ElasticsearchQueryBuilder {
  private _query: QueryDslQueryContainer = {};
  private _index: string;
  private _from: number;
  private _size: number;
  private _exclude: string[];
  private _elasticsearch: Client;
  private _sort = [];
  private _filter = [];
  private _aggs = {};

  constructor() {
    this._elasticsearch = elasticsearch;
  }

  index(name: string) {
    this._index = name;
    return this;
  }

  from(from: number) {
    this._from = from;
    return this;
  }

  size(size: number) {
    this._size = size;
    return this;
  }

  exclude(fieldsToExclude: string[]) {
    this._exclude = fieldsToExclude;
    return this;
  }

  query(query: QueryDslQueryContainer) {
    this._query = merge({}, this._query, query);
    return this;
  }

  private _mergeFilters(obj, filters) {
    forOwn(obj, (value, key) => {
      if (key === 'filter' && isArray(value)) {
        // Merge the new filters array with the existing filter array
        obj[key] = concat(value, filters);
      } else if (isObject(value)) {
        // Recursively call the function for nested objects
        this._mergeFilters(value, filters);
      }
    });
  }

  filter(filters: any[]) {
    this._mergeFilters(this._query, filters);
    return this;
  }

  sort(sort: any[]) {
    this._sort = this._sort.concat(sort);
    return this;
  }

  aggregate(aggs) {
    this._aggs = aggs;
    return this;
  }

  async search() {
    return await this._elasticsearch.search({
      index: this._index,
      from: this._from,
      size: this._size,
      _source_excludes: this._exclude,
      query: this._query,
      aggs: this._aggs,
    });
  }
}
