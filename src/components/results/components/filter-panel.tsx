import { useRouter } from 'next/router';
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

  function handledOnChecked(filter: string, filterKey: string) {
    return (checked: boolean) => {
      const newQuery = {
        ...router.query,
      };

      const key = `filters[${filter}]`;
      let current = newQuery[key];
      if (current == null) {
        current = [];
      }

      if (current != null && !(current instanceof Array)) {
        current = [current];
      }

      current = current as string[]; // adding this for type checking

      if (checked && !current.includes(filterKey)) {
        current.push(filterKey);
      } else {
        const idx = current.findIndex((v) => v === filterKey);
        if (idx !== -1) {
          current.splice(idx, 1);
        }
      }

      newQuery[key] = current;

      router.push({
        pathname: '/search',
        query: newQuery,
      });
    };
  }

  function getChecked(filter: string, filterKey: string) {
    return (
      router.query[`filters[${filter}]`]?.includes(filterKey) ||
      router.query[`filters[${filter}]`] == filterKey
    );
  }

  const myFilters = getFilters();

  if (myFilters.length === 0) return null;

  return (
    <>
      <div className="hidden w-full max-w-[250px] lg:block">
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
                            checked={getChecked(el.name, innerEl.key)}
                            onCheckedChange={handledOnChecked(
                              el.name,
                              innerEl.key,
                            )}
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
                                  checked={getChecked(el.name, innerEl.key)}
                                  onCheckedChange={handledOnChecked(
                                    el.name,
                                    innerEl.key,
                                  )}
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
