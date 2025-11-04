import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { filtersAtom, filtersOpenAtom } from '@/shared/store/results';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import qs from 'qs';
import { useTranslation } from 'next-i18next';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { cn } from '@/shared/lib/utils';
import { Filter } from 'lucide-react';
import { HEADER_ID } from '@/shared/lib/constants';
import { useAppConfig } from '@/shared/hooks/use-app-config';

const MAX_VISIBLE_FILTERS = 6;

const Filters = ({ filters, filterKeys }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const q: any = qs.parse(router.asPath.slice(router.asPath.indexOf('?') + 1));

  const [filtersExpanded, setFiltersExpanded] = useState<{
    [key: string]: boolean;
  }>({});

  const updateFilterExpanded = useCallback((key: string) => {
    setFiltersExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const clearFilters = () => {
    const q: any =
      router.asPath.indexOf('?') > -1
        ? qs.parse(router.asPath.slice(router.asPath.indexOf('?') + 1))
        : {};

    delete q.filters;

    const str = qs.stringify(q);
    const query = str.length > 0 ? `?${str}` : '';

    router.push(`/search${query}`);
  };

  if (filterKeys.length === 0) return null;

  return (
    <div className="py-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{t('filters', 'Filters')}</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
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
          const filter = filters[key];
          let filterList = filter.buckets;

          const originalCount = filter.buckets.length;
          const filtersExpandedForKey = filtersExpanded[key] ?? false;

          if (!filtersExpandedForKey) {
            filterList = filterList.slice(0, MAX_VISIBLE_FILTERS);
          }

          return (
            <div key={key} className="flex flex-col gap-1">
              <h3 className="font-medium">{heading}</h3>
              <div className="flex flex-col gap-2">
                {filterList.map((b) => (
                  <div
                    key={b.key}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={q.filters?.[key]?.includes(b.key) ?? false}
                        onCheckedChange={(checked) => {
                          const q: any =
                            router.asPath.indexOf('?') > -1
                              ? qs.parse(
                                  router.asPath.slice(
                                    router.asPath.indexOf('?') + 1,
                                  ),
                                )
                              : {};

                          if (!q.filters) {
                            q.filters = {};
                          }

                          if (!(q.filters[key] instanceof Array)) {
                            q.filters[key] = [];
                          }

                          if (checked && !q.filters[key].includes(b.key)) {
                            q.filters[key].push(b.key);
                          } else {
                            const idx = q.filters[key].findIndex(
                              (v: any) => v === b.key,
                            );
                            q.filters[key].splice(idx, 1);
                          }

                          const str = qs.stringify(q);
                          const query = str.length > 0 ? `?${str}` : '';

                          router.push(`/search${query}`);
                        }}
                      />
                      {b.key}
                    </label>

                    <Badge className="bg-[rgba(0,0,0,0.03)]" variant="outline">
                      {b.doc_count}
                    </Badge>
                  </div>
                ))}
                {originalCount > MAX_VISIBLE_FILTERS && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-fit px-0"
                    onClick={() => updateFilterExpanded(key)}
                  >
                    {filtersExpandedForKey
                      ? t('search.show_less', { ns: 'common' })
                      : t('search.show_all', {
                          ns: 'common',
                          count: originalCount,
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
        if (scrollOffsetRef.current <= -maxMinusOffsetRef.current) {
          return;
        }

        scrollOffsetRef.current = Math.max(
          (scrollOffsetRef.current ?? 0) - delta,
          -maxMinusOffsetRef.current,
        );
      } else if (delta < 0) {
        if (scrollOffsetRef.current >= maxPlusOffsetRef.current) {
          return;
        }

        scrollOffsetRef.current = Math.min(
          scrollOffsetRef.current - delta,
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
