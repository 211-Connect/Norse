'use client';
import { SearchResultResponse } from '@/lib/server/fetch-search-results';
import { MapContainer } from '../components/map-container';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { TaxonomyContainer } from '../components/taxonomy-container';
import { cn } from '@/lib/cn-utils';
import { useAtomValue, useSetAtom } from 'jotai/react';
import { filtersAtom, filtersOpenAtom } from '@/shared/store/results';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { ResultTotal } from '../components/result-total';
import { ResultsPagination } from '../components/results-pagination';
import { Result } from '../components/result';
import { NoResultsCard } from '../components/no-results-card';

type ListViewTemplateProps = {
  resultData: SearchResultResponse;
};

export function ListViewTemplate({ resultData }: ListViewTemplateProps) {
  const setFiltersOpen = useSetAtom(filtersOpenAtom);
  const filters = useAtomValue(filtersAtom);
  const filterKeys = Object.keys(filters);

  return (
    <div className="flex h-full w-full">
      {/* <FilterPanel /> */}

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
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              filterKeys.length > 0 ? 'flex xl:hidden' : 'hidden',
              'gap-1',
            )}
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="size-4" />
            Filter
          </Button>

          <ResultTotal
            page={resultData?.page}
            total={resultData?.totalResults}
          />
        </div>

        <div className="flex flex-col gap-2 p-2">
          {resultData.results?.map((result) => (
            <Result key={result._id} data={result} />
          ))}
          {resultData.noResults && (
            <NoResultsCard showAltSubtitle={resultData.results?.length === 0} />
          )}

          <ResultsPagination
            page={resultData?.page}
            total={resultData?.totalResults}
          />
        </div>
      </div>
      <MapContainer results={resultData.results} />
    </div>
  );
}
