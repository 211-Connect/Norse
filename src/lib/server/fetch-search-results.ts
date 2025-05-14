import { z } from 'zod';
import { API_URL } from '../constants';
import qs from 'qs';
import { getTenantId } from './get-tenant-id';

const createComplexQuerySchema = (depth: number): z.ZodTypeAny => {
  if (depth <= 0) {
    return z.string(); // Base case: At depth 0, allow a simple string
  }

  return z
    .object({
      OR: z.array(createComplexQuerySchema(depth - 1)).optional(),
      AND: z.array(createComplexQuerySchema(depth - 1)).optional(),
    })
    .refine((data) => data.OR !== undefined || data.AND !== undefined, {
      message: "Object must have 'OR' or 'AND' property",
    });
};

const searchSchema = z.object({
  query: z
    .string()
    .or(z.array(z.string()))
    .or(createComplexQuerySchema(5))
    .default(''),
  query_type: z.string().default('text'),
  page: z.coerce.number().int().positive().default(1),
  coords: z
    .string()
    .transform((val) => {
      const parts = val.split(',');
      if (parts.length !== 2) {
        return undefined;
      }

      const numbers = parts.map(parseFloat);
      if (numbers.some(isNaN)) {
        return undefined;
      }

      return numbers;
    })
    .optional(),
  filters: z
    .string()
    .transform((val) => qs.parse(val))
    .default(''),
  distance: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().max(300).min(25).default(25),
});

export type SearchQueryParams = {
  location?: string;
  coords?: string;
  page?: string;
  distance?: string;
  limit?: string;
  query?: string;
  query_type?: string;
  filters?: string;
};

export type SearchResultResponse = {
  results: {
    _id: string;
    id: string;
    priority: number;
    serviceName: string;
    name: string;
    description: string;
    phone: string;
    website: string;
    address: string;
    summary: string;
    location: any;
    taxonomies: {
      name: string;
      code: string;
    }[];
  }[];
  noResults: boolean;
  totalResults: number;
  page: number;
  filters: any;
};

export async function fetchSearchResults(
  searchParams: SearchQueryParams,
  locale: string | undefined = '',
): Promise<{ data: SearchResultResponse | null; error: string | null }> {
  const tenantId = await getTenantId();

  if (!tenantId) {
    return { data: null, error: 'Tenant id not set' };
  }

  const { data: params, error } = searchSchema.safeParse(searchParams);

  if (error) {
    console.log(error);
    return { data: null, error: error.flatten().formErrors.join(', ') };
  }

  const response = await fetch(
    `${API_URL}/search?${qs.stringify({
      ...params,
      locale,
    })}`,
    {
      method: 'GET',
      headers: {
        'accept-language': locale,
        'x-api-version': '1',
        'x-tenant-id': tenantId,
      },
    },
  );

  if (!response.ok) {
    return { data: null, error: 'Unable to fetch search results' };
  }

  let data = await response.json();

  let totalResults =
    typeof data?.search?.hits?.total !== 'number'
      ? (data?.search?.hits?.total?.value ?? 0)
      : (data?.search?.hits?.total ?? 0);

  let noResults = false;
  if (totalResults === 0) {
    noResults = true;

    const noResultsResponse = await fetch(
      `${API_URL}/search?${qs.stringify({
        ...params,
        locale,
        query_type: 'more_like_this',
      })}`,
      {
        method: 'GET',
        headers: {
          'accept-language': locale,
          'x-api-version': '1',
          'x-tenant-id': tenantId,
        },
      },
    );

    if (!noResultsResponse.ok) {
      return {
        data: null,
        error: 'Unable to fetch search more_like_this results',
      };
    }

    data = await noResultsResponse.json();

    totalResults =
      typeof data?.search?.hits?.total !== 'number'
        ? (data?.search?.hit?.total?.value ?? 0)
        : (data?.search?.hits?.total ?? 0);
  }

  return {
    data: {
      results:
        data?.search?.hits?.hits?.map((hit: any) => {
          let mainAddress: string | null =
            `${hit._source?.location?.physical_address?.address_1}, ${hit._source?.location?.physical_address?.city}, ${hit._source?.location?.physical_address?.state}, ${hit._source?.location?.physical_address?.postal_code}`;

          if (
            mainAddress.includes('null') ||
            mainAddress.includes('undefined')
          ) {
            mainAddress = null;
          }

          const responseData = {
            _id: hit._id,
            id: hit?._source?.service_at_location_id ?? null,
            priority: hit?._source?.priority,
            serviceName: hit?._source?.service?.name ?? null,
            name: hit?._source?.name ?? null,
            summary: hit?._source?.service?.summary ?? null,
            description: hit?._source?.service?.description ?? null,
            phone: hit?._source?.phone ?? null,
            website: hit?._source?.url ?? null,
            address: mainAddress,
            location: hit?._source?.location?.point ?? null,
            taxonomies: hit?._source?.taxonomies ?? null,
          };

          return Object.fromEntries(
            Object.entries(responseData).filter(([, value]) => value != null),
          );
        }) ?? [],
      noResults,
      totalResults,
      page: params.page,
      filters: data?.search?.aggregations ?? {},
    },
    error: null,
  };
}
