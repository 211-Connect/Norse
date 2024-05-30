import { useRouter } from 'next/router';
import qs from 'qs';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent } from '../../ui/dialog';
import { atom, useAtom } from 'jotai';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterPanelStore {
  isOpen: boolean;
}

export const filterPanelAtom = atom<FilterPanelStore>({
  isOpen: false,
});

export function FilterPanel({ filters }: any) {
  const router = useRouter();
  const [filterPanel, setFilterPanel] = useAtom(filterPanelAtom);

  function getFilters() {
    const formattedFilters = [];
    for (const key in filters) {
      if (filters[key].buckets.length > 0) {
        formattedFilters.push({
          name: key,
          displayName: key
            .split('_')
            .map((el) => el[0].toUpperCase() + el.slice(1))
            .join(' '),
          buckets: filters[key].buckets,
        });
      }
    }

    return formattedFilters;
  }

  const q: any = qs.parse(router.asPath.slice(router.asPath.indexOf('?') + 1));
  const myFilters = getFilters();

  if (myFilters.length === 0) return null;

  return (
    <>
      <div className="w-full max-w-[250px] hidden lg:block">
        <div className="flex flex-col gap-4 p-2">
          {getFilters().map((el) => {
            return (
              <div key={el.name} className="flex flex-col gap-1">
                <h5 className="text-md font-semibold">{el.displayName}</h5>

                <div className="flex flex-col gap-1">
                  {el.buckets.map((innerEl: any) => {
                    return (
                      <div
                        className="flex items-center justify-between"
                        key={innerEl.key}
                      >
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={innerEl.key}
                            checked={
                              q.filters?.[el.name]?.includes(innerEl.key) ??
                              false
                            }
                            onCheckedChange={(checked: any) => {
                              const q: any = qs.parse(
                                router.asPath.slice(
                                  router.asPath.indexOf('?') + 1,
                                ),
                              );

                              if (!q.filters) {
                                q.filters = {};
                              }

                              if (!(q.filters[el.name] instanceof Array)) {
                                q.filters[el.name] = [];
                              }

                              if (
                                checked &&
                                !q.filters[el.name].includes(innerEl.key)
                              ) {
                                q.filters[el.name].push(innerEl.key);
                              } else {
                                const idx = q.filters[el.name].findIndex(
                                  (v: any) => v === innerEl.key,
                                );
                                q.filters[el.name].splice(idx, 1);
                              }

                              router.push(`/search?${qs.stringify(q)}`);
                            }}
                          />
                          <Label htmlFor={innerEl.key} className="text-sm">
                            {innerEl.key}
                          </Label>
                        </div>

                        <Badge>{innerEl.doc_count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        open={filterPanel.isOpen}
        onOpenChange={(open) =>
          setFilterPanel((prev) => ({
            ...prev,
            isOpen: open,
          }))
        }
      >
        <DialogContent>
          <div className="flex flex-col gap-2">
            <ScrollArea className="max-h-[500px]">
              <div className="flex flex-col gap-4 pr-3">
                {getFilters().map((el) => {
                  return (
                    <div key={el.name} className="flex flex-col gap-1">
                      <h5 className="text-md font-semibold">
                        {el.displayName}
                      </h5>

                      <div className="flex flex-col gap-2">
                        {el.buckets.map((innerEl: any) => {
                          return (
                            <div
                              className="flex items-center justify-between"
                              key={innerEl.key}
                            >
                              <div className="flex items-center gap-1">
                                <Checkbox
                                  id={innerEl.key}
                                  checked={
                                    q.filters?.[el.name]?.includes(
                                      innerEl.key,
                                    ) ?? false
                                  }
                                  onCheckedChange={(checked: any) => {
                                    const q: any = qs.parse(
                                      router.asPath.slice(
                                        router.asPath.indexOf('?') + 1,
                                      ),
                                    );

                                    if (!q.filters) {
                                      q.filters = {};
                                    }

                                    if (
                                      !(q.filters[el.name] instanceof Array)
                                    ) {
                                      q.filters[el.name] = [];
                                    }

                                    if (
                                      checked &&
                                      !q.filters[el.name].includes(innerEl.key)
                                    ) {
                                      q.filters[el.name].push(innerEl.key);
                                    } else {
                                      const idx = q.filters[el.name].findIndex(
                                        (v: any) => v === innerEl.key,
                                      );
                                      q.filters[el.name].splice(idx, 1);
                                    }

                                    router.push(`/search?${qs.stringify(q)}`);
                                  }}
                                />
                                <Label
                                  htmlFor={innerEl.key}
                                  className="text-sm"
                                >
                                  {innerEl.key}
                                </Label>
                              </div>

                              <Badge>{innerEl.doc_count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
