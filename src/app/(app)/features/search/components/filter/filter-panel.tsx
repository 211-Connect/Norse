'use client';

import { useAtom, useAtomValue } from 'jotai';
import { Filter } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout';
import { SearchLocationActions } from '@/app/(app)/shared/components/search/search-location-actions';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { ScrollArea } from '@/app/(app)/shared/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/app/(app)/shared/components/ui/sheet';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';
import { filtersAtom, filtersOpenAtom } from '@/app/(app)/shared/store/results';
import { searchCoordinatesAtom } from '@/app/(app)/shared/store/search';

import { AgeFilter } from './age-filter';
import { Filters } from './filters';
import { useFacetUiConfig } from './use-facet-ui-config';
import { useScrollOffset } from './use-scroll-offset';
import { useSearchResultsNavigation } from './use-search-results-navigation';

export function FilterPanel() {
  const { t } = useTranslation();
  const appConfig = useAppConfig();
  const showAgeFilter = appConfig.featureFlags.showAgeFilter;
  const filters = useAtomValue(filtersAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);

  const filterKeys = useMemo(() => Object.keys(filters), [filters]);

  const facetUiConfig = useFacetUiConfig(appConfig.search.facets);
  const hasSearchCoordinates = searchCoordinates.length === 2;

  const { scrollOffset } = useScrollOffset();
  const { isPending, updateSearchParams } = useSearchResultsNavigation();

  const handleDistanceChange = useCallback(
    (distance: string) => {
      updateSearchParams((params) => ({
        ...params,
        distance,
      }));
    },
    [updateSearchParams],
  );

  const renderFilters = useCallback(
    (idPrefix: string) =>
      filterKeys.length > 0 ? (
        <Filters
          idPrefix={idPrefix}
          filters={filters}
          filterKeys={filterKeys}
          facetUiConfig={facetUiConfig}
        />
      ) : null,
    [facetUiConfig, filterKeys, filters],
  );

  return (
    <div
      className={cn(
        'w-full self-start overflow-auto p-2.5 lg:max-w-75 lg:pl-5 xl:max-w-85',
        appConfig.header?.position === 'sticky' && 'md:sticky md:top-26',
        appConfig.header?.position === 'sticky' &&
          appConfig.newLayout?.enabled &&
          'md:top-38',
      )}
      id="filter-panel"
      style={{
        top: scrollOffset !== undefined ? `${scrollOffset}px` : undefined,
      }}
    >
      <div className="flex items-center print:hidden">
        <MainSearchLayout className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            filterKeys.length > 0 || showAgeFilter
              ? 'flex md:hidden'
              : 'hidden',
            'mt-1 gap-1 self-start',
          )}
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="size-4" />
          {t('search.filter', 'Filter')}
        </Button>
      </div>
      {hasSearchCoordinates && (
        <SearchLocationActions
          className="mt-3 print:hidden"
          showUseMyLocationButton={false}
          distanceSelectProps={{
            className: '',
            disabled: isPending,
            onValueChange: handleDistanceChange,
          }}
        />
      )}
      {showAgeFilter && (
        <div className="mt-3 print:hidden">
          <AgeFilter />
        </div>
      )}
      {(filterKeys.length > 0 || showAgeFilter) && (
        <>
          <div className="hidden w-full md:block print:hidden">
            {renderFilters('desktop')}
          </div>
          <Sheet onOpenChange={setFiltersOpen} open={filtersOpen}>
            <SheetContent
              side="left"
              className="max-h-screen overflow-y-scroll"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">
                  {t('filters', 'Filters')}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea>{renderFilters('sheet')}</ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
