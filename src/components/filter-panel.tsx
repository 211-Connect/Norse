import { useFilterPanelStore } from '../lib/state/filterPanel';
import { useRouter } from 'next/router';
import qs from 'qs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Dialog } from './ui/dialog';

export function FilterPanel({ filters }: any) {
  const router = useRouter();
  const state = useFilterPanelStore();

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
      <div className="w-full max-w-[250px] hidden md:block">
        <div className="flex flex-col gap-2 p-2">
          {getFilters().map((el) => {
            return (
              <div key={el.name} className="flex flex-col gap-2">
                <h5>{el.displayName}</h5>

                <div className="flex flex-col gap-2">
                  {el.buckets.map((innerEl: any) => {
                    return (
                      <div className="flex" key={innerEl.key}>
                        <Checkbox
                          checked={
                            q.filters?.[el.name]?.includes(innerEl.key) ?? false
                          }
                          onChange={(e: any) => {
                            const q: any = qs.parse(
                              router.asPath.slice(
                                router.asPath.indexOf('?') + 1
                              )
                            );

                            if (!q.filters) {
                              q.filters = {};
                            }

                            if (!(q.filters[el.name] instanceof Array)) {
                              q.filters[el.name] = [];
                            }

                            if (
                              e.target.checked &&
                              !q.filters[el.name].includes(innerEl.key)
                            ) {
                              q.filters[el.name].push(innerEl.key);
                            } else {
                              const idx = q.filters[el.name].findIndex(
                                (v: any) => v === innerEl.key
                              );
                              q.filters[el.name].splice(idx, 1);
                            }

                            router.push(`/search?${qs.stringify(q)}`);
                          }}
                        />

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

      <Dialog open={state.isOpen} onOpenChange={state.toggle}>
        <div className="flex flex-col gap-2">
          {getFilters().map((el) => {
            return (
              <div key={el.name} className="flex flex-col gap-2">
                <h5>{el.displayName}</h5>

                <div className="flex flex-col gap-2">
                  {el.buckets.map((innerEl: any) => {
                    return (
                      <div className="flex" key={innerEl.key}>
                        <Checkbox
                          checked={
                            q.filters?.[el.name]?.includes(innerEl.key) ?? false
                          }
                          onChange={(e: any) => {
                            const q: any = qs.parse(
                              router.asPath.slice(
                                router.asPath.indexOf('?') + 1
                              )
                            );

                            if (!q.filters) {
                              q.filters = {};
                            }

                            if (!(q.filters[el.name] instanceof Array)) {
                              q.filters[el.name] = [];
                            }

                            if (
                              e.target.checked &&
                              !q.filters[el.name].includes(innerEl.key)
                            ) {
                              q.filters[el.name].push(innerEl.key);
                            } else {
                              const idx = q.filters[el.name].findIndex(
                                (v: any) => v === innerEl.key
                              );
                              q.filters[el.name].splice(idx, 1);
                            }

                            router.push(`/search?${qs.stringify(q)}`);
                          }}
                        />

                        <Badge color="primary">{innerEl.doc_count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
