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
import { useCallback, useMemo, useState } from 'react';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { cn } from '@/shared/lib/utils';
import { Filter } from 'lucide-react';
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

export function FilterPanel() {
  const appConfig = useAppConfig();
  const filters = useAtomValue(filtersAtom);
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);

  const filterKeys = useMemo(() => Object.keys(filters), [filters]);

  return (
    <div
      className={cn(
        'w-full self-start overflow-auto p-[10px] lg:pl-[20px] xl:sticky xl:top-[105px] xl:max-w-[340px]',
        'xl:max-h-[calc(100vh-105px)]',
        appConfig.newLayout?.enabled && 'xl:top-[144px]',
        appConfig.newLayout?.enabled && 'lg:max-h-[calc(100vh-155px)]',
      )}
    >
      <div className="flex items-center print:hidden">
        <MainSearchLayout className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            filterKeys.length > 0 ? 'flex xl:hidden' : 'hidden',
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
          <div className="hidden w-full xl:block print:hidden">
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
