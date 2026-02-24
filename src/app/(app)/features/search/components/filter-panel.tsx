'use client';

import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
import { ScrollArea } from '@/app/(app)/shared/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/app/(app)/shared/components/ui/sheet';
import { filtersAtom, filtersOpenAtom } from '@/app/(app)/shared/store/results';
import { useAtom, useAtomValue } from 'jotai';
import qs from 'qs';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { useTranslation } from 'react-i18next';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

const MAX_VISIBLE_FILTERS = 6;

type FilterBucket = { key: string; doc_count: number };
type FilterEntry = { buckets: FilterBucket[] };
type FiltersMap = Record<string, FilterEntry>;
type ActiveFilters = Record<string, string[]>;

type FiltersProps = {
  filters: FiltersMap;
  filterKeys: string[];
};

const Filters = ({ filters, filterKeys }: FiltersProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { stringifiedSearchParams, searchParamsObject } =
    useClientSearchParams();
  const { start } = useTopLoader();
  const [isPending, setIsPending] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setIsPending(false);
  }, [stringifiedSearchParams]);

  const navigate = useCallback(
    (url: string) => {
      setIsPending(true);
      start();
      router.push(url);
    },
    [router, start],
  );

  const activeFilters = useMemo(
    () => (searchParamsObject.filters ?? {}) as ActiveFilters,
    [searchParamsObject.filters],
  );

  const applyFilters = useCallback(
    (newFilters?: ActiveFilters) => {
      const params = {
        ...searchParamsObject,
        ...(newFilters ? { filters: newFilters } : {}),
      };
      if (!newFilters) delete params.filters;
      const str = qs.stringify(params);
      navigate(`/search${str ? `?${str}` : ''}`);
    },
    [searchParamsObject, navigate],
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

  const toggleExpanded = useCallback((key: string) => {
    setFiltersExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const currentFilters = activeFilters;

  if (filterKeys.length === 0) return null;

  return (
    <div className="py-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{t('filters', 'Filters')}</h3>
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
          const heading = key
            .split('_')
            .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
            .join(' ');
          const filterList = filters[key].buckets.filter(
            (b) => b.key != null && b.key !== '',
          );
          const isExpanded = filtersExpanded[key] ?? false;
          const visibleList = isExpanded
            ? filterList
            : filterList.slice(0, MAX_VISIBLE_FILTERS);

          return (
            <div key={key} className="flex flex-col gap-1">
              <h3 className="font-medium">{heading}</h3>
              <div className="flex flex-col gap-2">
                {visibleList.map((b) => (
                  <div
                    key={b.key}
                    className="flex items-center justify-between"
                  >
                    <label
                      className="flex items-center gap-2 text-sm"
                      htmlFor={b.key}
                    >
                      <Checkbox
                        aria-label={b.key}
                        id={b.key}
                        disabled={isPending}
                        checked={currentFilters[key]?.includes(b.key) ?? false}
                        onCheckedChange={(checked) =>
                          toggleFilter(key, b.key, !!checked)
                        }
                      />
                      {b.key}
                    </label>
                    <Badge className="bg-[rgba(0,0,0,0.03)]" variant="outline">
                      {b.doc_count}
                    </Badge>
                  </div>
                ))}
                {filterList.length > MAX_VISIBLE_FILTERS && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-fit px-0"
                    onClick={() => toggleExpanded(key)}
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
            </div>
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
  const appConfig = useAppConfig();
  const filters = useAtomValue(filtersAtom);
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);

  const filterKeys = useMemo(() => Object.keys(filters), [filters]);

  const { scrollOffset } = useScrollOffset();

  return (
    <div
      className={cn(
        'w-full self-start overflow-auto p-[10px] md:sticky md:top-[105px] md:max-w-[340px] lg:pl-[20px]',
        appConfig.newLayout?.enabled && 'md:top-[155px]',
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
          Filter
        </Button>
      </div>
      {filterKeys.length > 0 && (
        <>
          <div className="hidden w-full md:block print:hidden">
            <Filters filters={filters} filterKeys={filterKeys} />
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
                <Filters filters={filters} filterKeys={filterKeys} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
