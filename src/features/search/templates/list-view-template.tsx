import {
  fetchSearchResults,
  SearchQueryParams,
} from '@/lib/server/fetch-search-results';
import { MapContainer } from '../components/map-container';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { TaxonomyContainer } from '../components/taxonomy-container';
import { cn } from '@/lib/cn-utils';
import { ResultTotal } from '../components/result-total';
import { ResultsPagination } from '../components/results-pagination';
import { Result } from '../components/result';
import { NoResultsCard } from '../components/no-results-card';
import { FilterPanel } from '../components/filter-panel';
import { ToggleFilterPanelButton } from '../components/filter-panel/toggle-filter-panel-button';

type ListViewTemplateProps = {
  searchParams: Promise<SearchQueryParams>;
  params: Promise<{ locale: string }>;
};

export async function ListViewTemplate({
  searchParams,
  params,
}: ListViewTemplateProps) {
  const [queryParams, parsedParams] = await Promise.all([searchParams, params]);

  const { data } = await fetchSearchResults(queryParams, parsedParams?.locale);

  if (!data) {
    throw new Error('Error fetching search results');
  }

  const filterKeys = Object.keys(data.filters);

  return (
    <div className="flex h-full w-full">
      <FilterPanel filters={data.filters} />

      <div
        id="search-container"
        className="flex w-full flex-col overflow-y-auto lg:max-w-[550px]"
      >
        <div className="flex flex-col gap-2 bg-white p-2 print:hidden">
          <MainSearchLayout />
          <TaxonomyContainer />
        </div>

        <div
          className={cn(
            filterKeys.length > 0
              ? 'justify-between xl:justify-end'
              : 'justify-end',
            'flex items-center bg-primary p-1 pl-2 pr-2 text-primary-foreground print:hidden',
          )}
        >
          <ToggleFilterPanelButton filterKeys={filterKeys} />
          <ResultTotal page={data?.page} total={data?.totalResults} />
        </div>

        <div className="flex flex-col gap-2 p-2">
          {data.noResults && (
            <NoResultsCard showAltSubtitle={data.results?.length === 0} />
          )}
          {data.results?.map((result) => (
            <Result key={result._id} data={result} />
          ))}

          <ResultsPagination page={data?.page} total={data?.totalResults} />
        </div>
      </div>
      <MapContainer results={data.results} />
    </div>
  );
}
