'use client';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { filtersOpenAtom } from '@/shared/store/results';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { SearchResultResponse } from '@/lib/server/fetch-search-results';
import { Filters } from './filters';

type FilterPanelProps = {
  filters: SearchResultResponse['filters'];
};

export function FilterPanel({ filters }: FilterPanelProps) {
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);
  const filterKeys = Object.keys(filters || {});

  useEffect(() => {
    if (!filterKeys.length) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [filterKeys]);

  if (filterKeys.length === 0) return null;

  return (
    <>
      <div className="hidden w-full max-w-72 bg-white xl:block print:hidden">
        <Filters filters={filters} filterKeys={filterKeys} />
      </div>
      <Sheet onOpenChange={setFiltersOpen} open={filtersOpen}>
        <SheetContent side="left" className="max-h-screen overflow-y-scroll">
          <SheetHeader>
            <SheetTitle></SheetTitle>
          </SheetHeader>
          <ScrollArea>
            <Filters filters={filters} filterKeys={filterKeys} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
