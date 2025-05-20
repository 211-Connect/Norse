import {
  fetchSearchResults,
  SearchQueryParams,
} from '@/lib/server/fetch-search-results';
import { MapContainer } from '../components/map-container';
import { TaxonomyContainer } from '../components/taxonomy-container';
import { cn } from '@/lib/cn-utils';
import { ResultTotal } from '../components/result-total';
import { ResultsPagination } from '../components/results-pagination';
import { Result } from '../components/result';
import { NoResultsCard } from '../components/no-results-card';
import { FilterPanel } from '../components/filter-panel';
import { ToggleFilterPanelButton } from '../components/filter-panel/toggle-filter-panel-button';
import { SearchForm } from './search-form';

type ListViewTemplateProps = {
  searchParams: SearchQueryParams;
};

export async function ListViewTemplate({
  searchParams,
}: ListViewTemplateProps) {
  const queryParams = await searchParams;

  const { data, error } = await fetchSearchResults(queryParams);

  if (error || !data) {
    throw new Error('Error fetching search results');
  }

  const filterKeys = data.noResults ? [] : Object.keys(data?.filters);

  return (
    <div className="flex h-full w-full">
      <FilterPanel filters={data.filters} />

      <div
        id="search-container"
        className="flex w-full flex-col overflow-y-auto lg:max-w-[550px]"
      >
        <div className="flex flex-col gap-2 bg-white p-2 print:hidden">
          <SearchForm />
          <TaxonomyContainer
            query={queryParams.query}
            queryType={queryParams.query_type}
          />
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
