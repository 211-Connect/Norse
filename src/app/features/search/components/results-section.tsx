'use client';

import { MainSearchLayout } from '@/app/shared/components/search/main-search-layout';
import { Button } from '@/app/shared/components/ui/button';
import { Filter } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { filtersAtom, filtersOpenAtom } from '@/app/shared/store/results';
import { cn } from '@/app/shared/lib/utils';
import { useRef } from 'react';

import { ResultTotal } from './result-total';
import { RenderResults } from './render-results';
import { ResultsPagination } from './results-pagination';
import { TaxonomyContainer } from './taxonomy-container';

export function ResultsSection() {
  const setFiltersOpen = useSetAtom(filtersOpenAtom);
  const filters = useAtomValue(filtersAtom);
  const filterKeys = Object.keys(filters);
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
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

        <ResultTotal />
      </div>

      <div className="flex flex-col gap-2 p-2" ref={componentToPrintRef}>
        <RenderResults componentToPrintRef={componentToPrintRef} />
        <ResultsPagination />
      </div>
    </div>
  );
}
