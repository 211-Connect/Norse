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

const Filters = ({ filters, filterKeys }) => {
  const router = useRouter();
  const q: any = qs.parse(router.asPath.slice(router.asPath.indexOf('?') + 1));

  if (filterKeys.length === 0) return null;

  return (
    <>
      {filterKeys.map((key) => {
        const heading = key
          .split('_')
          .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
          .join(' ');
        const filter = filters[key];

        return (
          <div key={key} className="p-2">
            <h3 className="font-bold">{heading}</h3>
            <div className="flex flex-col gap-1">
              {filter.buckets.map((b) => (
                <div key={b.key} className="flex items-center justify-between">
                  <label className="flex items-center gap-1 text-sm">
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
    </>
  );
};

export function FilterPanel() {
  const filters = useAtomValue(filtersAtom);
  const filterKeys = Object.keys(filters);
  const [filtersOpen, setFiltersOpen] = useAtom(filtersOpenAtom);

  if (filterKeys.length === 0) return null;

  return (
    <>
      <div className="hidden w-full max-w-64 xl:block">
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
