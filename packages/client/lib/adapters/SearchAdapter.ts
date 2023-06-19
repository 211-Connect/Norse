import { BaseAdapter } from './BaseAdapter';
import qs from 'qs';

export interface IResult {
  _id: string;
  id: string;
  serviceName: string;
  name: string;
  description: string;
  phone: string;
  website: string;
  address?: string;
  location: {
    coordinates: [number, number];
  };
}

export class SearchAdapter extends BaseAdapter {
  public async search(
    query: any,
    page: number = 1,
    config?: { locale?: string }
  ): Promise<{
    results: IResult[];
    noResults: boolean;
    totalResults: number;
    page: number;
    filters: any;
  }> {
    if (isNaN(page)) {
      page = 1;
    }

    let { data } = await this.axios.get(
      `/search?${qs.stringify({
        ...query,
        page,
      })}`,
      {
        ...(config?.locale ? { headers: { 'x-locale': config.locale } } : {}),
      }
    );

    let totalResults =
      typeof data?.search?.hits?.total !== 'number'
        ? data?.search?.hits?.total?.value ?? 0
        : data?.search?.hits?.total ?? 0;

    let noResults = false;
    if (totalResults === 0) {
      noResults = true;
      data = await this.axios.get(
        `/search?${qs.stringify({
          ...query,
          page,
          query_type: 'more_like_this',
        })}`
      );

      totalResults =
        typeof data?.search?.hits?.total !== 'number'
          ? data?.search?.hit?.total?.value ?? 0
          : data?.search?.hits?.total ?? 0;
    }

    return {
      results:
        data?.search?.hits?.hits?.map((hit: any) => {
          let mainAddress:
            | string
            | null = `${hit._source.address_1}, ${hit._source.city}, ${hit._source.state}, ${hit._source.postal_code}`;

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
        }) ?? [],
      noResults,
      totalResults,
      page,
      filters: data?.search?.aggregations ?? {},
    };
  }
}
