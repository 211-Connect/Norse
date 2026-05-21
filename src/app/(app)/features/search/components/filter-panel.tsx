'use client';

import { useAtom, useAtomValue } from 'jotai';
import { Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import qs from 'qs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout';
import { SearchLocationActions } from '@/app/(app)/shared/components/search/search-location-actions';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
import { ScrollArea } from '@/app/(app)/shared/components/ui/scroll-area';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/app/(app)/shared/components/ui/sheet';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import { cn } from '@/app/(app)/shared/lib/utils';
import { filtersAtom, filtersOpenAtom } from '@/app/(app)/shared/store/results';
import { searchCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { FiltersMap } from '@/types/search';

const MAX_VISIBLE_FILTERS = 6;
const SEARCH_RESULTS_HEADING_ID = 'search-results-heading';
const PENDING_FOCUS_TARGET_STORAGE_KEY = 'pending-search-focus-target';

type ActiveFilters = Record<string, string[]>;

type FiltersProps = {
  filters: FiltersMap;
  filterKeys: string[];
  isPending: boolean;
  searchParamsObject: Record<string, unknown>;
  updateSearchParams: (
    updater: (params: Record<string, unknown>) => Record<string, unknown>,
  ) => void;
};

function queueResultsFocus() {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    PENDING_FOCUS_TARGET_STORAGE_KEY,
    SEARCH_RESULTS_HEADING_ID,
  );
}

function useSearchResultsNavigation() {
  const router = useRouter();
  const { stringifiedSearchParams, searchParamsObject } =
    useClientSearchParams();
  const { start } = useTopLoader();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
  }, [stringifiedSearchParams]);

  const updateSearchParams = useCallback(
    (updater: (params: Record<string, unknown>) => Record<string, unknown>) => {
      queueResultsFocus();

      const nextParams = updater({ ...searchParamsObject });

      if ('page' in nextParams) {
        delete nextParams.page;
      }

      const search = qs.stringify(nextParams);

      setIsPending(true);
      start();
      router.push(`/search${search ? `?${search}` : ''}`);
    },
    [router, searchParamsObject, start],
  );

  return {
    isPending,
    searchParamsObject,
    updateSearchParams,
  };
}

const Filters = ({
  filters,
  filterKeys,
  isPending,
  searchParamsObject,
  updateSearchParams,
}: FiltersProps) => {
  const { t } = useTranslation();
  const [filtersExpanded, setFiltersExpanded] = useState<
    Record<string, boolean>
  >({});
  const expandButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const firstHiddenFilterRefs = useRef<
    Record<string, HTMLButtonElement | null>
  >({});

  const activeFilters = useMemo(
    () => (searchParamsObject.filters ?? {}) as ActiveFilters,
    [searchParamsObject.filters],
  );

  const applyFilters = useCallback(
    (newFilters?: ActiveFilters) => {
      updateSearchParams((params) => {
        if (!newFilters) {
          delete params.filters;
          return params;
        }

        return {
          ...params,
          filters: newFilters,
        };
      });
    },
    [updateSearchParams],
  );

  const toggleFilter = useCallback(
    (key: string, value: string, checked: boolean) => {
      const current = Array.isArray(activeFilters[key])
        ? [...activeFilters[key]]
        : [];
      const next = checked
        ? [...new Set([...current, value])]
        : current.filter((v) => v !== value);
      applyFilters({ ...activeFilters, [key]: next });
    },
    [activeFilters, applyFilters],
  );

  const toggleExpanded = useCallback((key: string, expanded: boolean) => {
    setFiltersExpanded((prev) => ({ ...prev, [key]: expanded }));

    window.requestAnimationFrame(() => {
      if (expanded) {
        firstHiddenFilterRefs.current[key]?.focus();
        firstHiddenFilterRefs.current[key]?.scrollIntoView({
          block: 'nearest',
        });
        return;
      }

      expandButtonRefs.current[key]?.focus({ preventScroll: true });
      const el = expandButtonRefs.current[key];
      if (el) {
        const header = document.getElementById(HEADER_ID);
        const headerHeight = header?.offsetHeight ?? 0;
        const rect = el.getBoundingClientRect();
        if (rect.top < headerHeight + 8) {
          window.scrollBy({
            top: rect.top - headerHeight - 8,
            behavior: 'smooth',
          });
        }
      }
    });
  }, []);

  const currentFilters = activeFilters;

  if (filterKeys.length === 0) return null;

  return (
    <div className="py-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{t('filters', 'Filters')}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => applyFilters()}
          disabled={isPending}
        >
          {t('clear_filters', 'Clear filters')}
        </Button>
      </div>

      <Separator className="mb-4" />

      <div className="flex flex-col gap-4">
        {filterKeys.map((key) => {
          const heading = filters[key].name;
          const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const filterList = filters[key].buckets.filter(
            (b) =>
              b.key != null &&
              b.key !== '' &&
              b.display != null &&
              b.display !== '',
          );
          const isExpanded = filtersExpanded[key] ?? false;
          const visibleList = filterList.slice(0, MAX_VISIBLE_FILTERS);
          const hiddenList = filterList.slice(MAX_VISIBLE_FILTERS);
          const expandedListId = `filter-group-options-${sanitizedKey}`;

          return (
            <fieldset key={key} className="flex flex-col gap-1">
              <legend className="sr-only">{heading}</legend>
              <h3 className="font-medium">{heading}</h3>
              <div className="flex flex-col gap-2">
                {visibleList.map((b, index) => {
                  const countId = `filter-count-${sanitizedKey}-${index}`;

                  return (
                    <div
                      key={b.key}
                      className="flex items-center justify-between"
                    >
                      <label
                        className="flex items-center gap-2 text-sm"
                        htmlFor={b.key}
                      >
                        <Checkbox
                          aria-describedby={countId}
                          aria-label={b.key}
                          id={b.key}
                          disabled={isPending}
                          checked={
                            currentFilters[key]?.includes(b.key) ?? false
                          }
                          onCheckedChange={(checked) =>
                            toggleFilter(key, b.key, !!checked)
                          }
                        />
                        {b.display}
                      </label>
                      <Badge
                        className="bg-[rgba(0,0,0,0.03)]"
                        variant="outline"
                      >
                        <span id={countId}>
                          <span aria-hidden="true">{b.doc_count}</span>
                          <span className="sr-only">
                            {t('filter_results_count', {
                              count: b.doc_count,
                            })}
                          </span>
                        </span>
                      </Badge>
                    </div>
                  );
                })}
                {hiddenList.length > 0 && isExpanded && (
                  <div id={expandedListId} className="flex flex-col gap-2">
                    {hiddenList.map((b, index) => {
                      const hiddenIndex = visibleList.length + index;
                      const countId = `filter-count-${sanitizedKey}-${hiddenIndex}`;

                      return (
                        <div
                          key={b.key}
                          className="flex items-center justify-between"
                        >
                          <label
                            className="flex items-center gap-2 text-sm"
                            htmlFor={b.key}
                          >
                            <Checkbox
                              ref={(element) => {
                                if (index === 0) {
                                  firstHiddenFilterRefs.current[key] = element;
                                }
                              }}
                              aria-describedby={countId}
                              aria-label={b.key}
                              id={b.key}
                              disabled={isPending}
                              checked={
                                currentFilters[key]?.includes(b.key) ?? false
                              }
                              onCheckedChange={(checked) =>
                                toggleFilter(key, b.key, !!checked)
                              }
                            />
                            {b.display}
                          </label>
                          <Badge
                            className="bg-[rgba(0,0,0,0.03)]"
                            variant="outline"
                          >
                            <span id={countId}>
                              <span aria-hidden="true">{b.doc_count}</span>
                              <span className="sr-only">
                                {t('filter_results_count', {
                                  count: b.doc_count,
                                })}
                              </span>
                            </span>
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
                {filterList.length > MAX_VISIBLE_FILTERS && (
                  <Button
                    ref={(element) => {
                      expandButtonRefs.current[key] = element;
                    }}
                    variant="link"
                    size="sm"
                    className="w-fit px-0"
                    aria-controls={expandedListId}
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpanded(key, !isExpanded)}
                  >
                    {isExpanded
                      ? t('search.show_less', { ns: 'common' })
                      : t('search.show_all', {
                          ns: 'common',
                          count: filterList.length,
                        })}
                  </Button>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
};

const useScrollOffset = () => {
  const [scrollOffset, setScrollOffset] = useState<number>();

  const lastScrollYRef = useRef(0);
  const scrollOffsetRef = useRef(scrollOffset);

  const maxMinusOffsetRef = useRef(0);
  const maxPlusOffsetRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleResize = () => {
      const element = document.querySelector('#filter-panel') as HTMLDivElement;
      const header = document.querySelector(`#${HEADER_ID}`) as HTMLDivElement;

      if (element && header) {
        maxMinusOffsetRef.current = element.clientHeight - window.innerHeight;
        maxPlusOffsetRef.current = header.offsetHeight;
      }
    };

    const handleScroll = () => {
      const delta = window.scrollY - lastScrollYRef.current;

      lastScrollYRef.current = window.scrollY;

      if (delta > 0) {
        if (scrollOffsetRef.current! <= -maxMinusOffsetRef.current) {
          return;
        }

        scrollOffsetRef.current = Math.max(
          (scrollOffsetRef.current ?? 0) - delta,
          -maxMinusOffsetRef.current,
        );
      } else if (delta < 0) {
        if (scrollOffsetRef.current! >= maxPlusOffsetRef.current) {
          return;
        }

        scrollOffsetRef.current = Math.min(
          scrollOffsetRef.current! - delta,
          maxPlusOffsetRef.current,
        );
      }

      setScrollOffset(scrollOffsetRef.current);
    };

    handleResize();

    const resize_ob = new ResizeObserver(handleResize);

    const element = document.querySelector('#filter-panel') as HTMLDivElement;
    if (element) {
      resize_ob.observe(element);
      const topStyle = window.getComputedStyle(element).top ?? '0px';
      const parsedStyle = parseInt(topStyle.replace('px', ''), 10);
      scrollOffsetRef.current = parsedStyle;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);

      if (element) {
        resize_ob.unobserve(element);
      }
    };
  }, []);

  return {
    scrollOffset,
  };
};

export function FilterPanel() {
  const { t } = useTranslation();
  const appConfig = useAppConfig();
  const filters = useAtomValue(filtersAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);

  const filterKeys = useMemo(() => Object.keys(filters), [filters]);
  const hasSearchCoordinates = searchCoordinates.length === 2;

  const { scrollOffset } = useScrollOffset();
  const { isPending, searchParamsObject, updateSearchParams } =
    useSearchResultsNavigation();

  const handleDistanceChange = useCallback(
    (distance: string) => {
      updateSearchParams((params) => ({
        ...params,
        distance,
      }));
    },
    [updateSearchParams],
  );

  return (
    <div
      className={cn(
        'w-full self-start overflow-auto p-[10px] lg:max-w-[300px] lg:pl-[20px] xl:max-w-[340px]',
        appConfig.header?.position === 'sticky' && 'md:sticky md:top-[105px]',
        appConfig.header?.position === 'sticky' &&
          appConfig.newLayout?.enabled &&
          'md:top-[155px]',
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
            filterKeys.length > 0 ? 'flex md:hidden' : 'hidden',
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
      {filterKeys.length > 0 && (
        <>
          <div className="hidden w-full md:block print:hidden">
            <Filters
              filters={filters}
              filterKeys={filterKeys}
              isPending={isPending}
              searchParamsObject={searchParamsObject}
              updateSearchParams={updateSearchParams}
            />
          </div>
          <Sheet onOpenChange={setFiltersOpen} open={filtersOpen}>
            <SheetContent
              side="left"
              className="max-h-screen overflow-y-scroll"
            >
              <SheetHeader>
                <SheetTitle></SheetTitle>
              </SheetHeader>
              <ScrollArea>
                <Filters
                  filters={filters}
                  filterKeys={filterKeys}
                  isPending={isPending}
                  searchParamsObject={searchParamsObject}
                  updateSearchParams={updateSearchParams}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
