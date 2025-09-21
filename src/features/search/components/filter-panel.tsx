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
import { useEffect } from 'react';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { TaxonomyContainer } from './taxonomy-container';

const Filters = ({ filters, filterKeys }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const q: any = qs.parse(router.asPath.slice(router.asPath.indexOf('?') + 1));

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
    <div className="p-6">
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

          return (
            <div key={key} className="flex flex-col gap-1">
              <h3 className="font-semibold">{heading}</h3>
              <div className="flex flex-col gap-2">
                {filter.buckets.map((b) => (
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

                    <Badge variant="outline">{b.doc_count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function FilterPanel() {
  const filters = useAtomValue(filtersAtom);
  const filterKeys = Object.keys(filters);
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);

  useEffect(() => {
    if (!filterKeys.length) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [filterKeys]);

  return (
    <div className="p-[10px]">
      <div className="flex flex-col gap-2 bg-white p-2 print:hidden">
        <MainSearchLayout />
        <TaxonomyContainer />
      </div>
      {filterKeys.length > 0 && (
        <>
          <div className="hidden w-full max-w-72 bg-white xl:block print:hidden">
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
