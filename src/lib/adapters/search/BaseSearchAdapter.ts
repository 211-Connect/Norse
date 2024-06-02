import { ISearchResponse } from '@/types/search-result';
import z from 'zod';

export type QueryConfig = {
  query?: string;
  query_type?: string;
  page?: string;
  coords?: string;
  filters?: string;
  distance?: string;
  locale: string;
};

export abstract class BaseSearchAdapter {
  queryConfigSchema = z.object({
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

  abstract search(
    config: QueryConfig,
  ): ISearchResponse | Promise<ISearchResponse>;
}
