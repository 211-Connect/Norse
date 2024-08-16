import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { ResultTotal } from './result-total';
import { RenderResults } from './render-results';
import { ResultsPagination } from './results-pagination';
import { Button } from '@/shared/components/ui/button';
import { Filter } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { filtersOpenAtom } from '@/shared/store/results';

export function ResultsSection() {
  const setFiltersOpen = useSetAtom(filtersOpenAtom);

  return (
    <div
      id="search-container"
      className="flex w-full flex-col overflow-y-auto lg:max-w-[550px]"
    >
      <div className="bg-white p-2">
        <MainSearchLayout />
      </div>

      <div className="flex items-center justify-between bg-primary p-1 pl-2 pr-2 text-primary-foreground xl:justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="flex gap-1 xl:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="size-4" />
          Filter
        </Button>

        <ResultTotal />
      </div>

      <div className="flex flex-col gap-2 p-2">
        <RenderResults />
        <ResultsPagination />
      </div>
    </div>
  );
}
