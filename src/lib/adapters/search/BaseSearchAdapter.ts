import { ISearchResponse, ISuggestionResult } from '@/types/search-result';
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

export type SuggestConfig = {
  query?: string;
  code?: string;
  page?: string;
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
      .preprocess(
        (v) =>
          v == null || (typeof v === 'string' && v.length === 0)
            ? 0
            : parseInt(v as string),
        z.number().nonnegative(),
      )
      .default(0),
    locale: z.string().default('en'),
  });

  suggestConfigSchema = z.object({
    query: z.string().optional(),
    code: z.string().optional(),
    page: z.number().default(1),
    locale: z.string().default('en'),
  });

  abstract search(
    config: QueryConfig,
  ): ISearchResponse | Promise<ISearchResponse>;

  abstract suggest(
    config: SuggestConfig,
  ): ISuggestionResult[] | Promise<ISuggestionResult[]>;
}
