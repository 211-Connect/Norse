import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchResultResponse } from '@/lib/server/fetch-search-results';
import { createParser, useQueryState } from 'nuqs';
import qs from 'qs';

type FilterProps = {
  filters: SearchResultResponse['filters'];
  filterKey: string;
};

const parser = createParser({
  parse(value) {
    return qs.parse(value);
  },
  serialize(value) {
    return qs.stringify(value);
  },
});

export function Filter({ filters, filterKey }: FilterProps) {
  const [json, setJson] = useQueryState('filters', {
    ...parser,
    shallow: false,
  });

  const heading = filterKey
    .split('_')
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(' ');
  const filter = filters[filterKey];

  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-semibold">{heading}</h3>
      <div className="flex flex-col gap-2">
        {filter.buckets.map((bucket) => (
          <div key={bucket.key} className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={
                  json != null && json[filterKey] instanceof Array
                    ? json[filterKey].includes(bucket.key)
                    : false
                }
                onCheckedChange={(checked) => {
                  setJson((prev) => {
                    const newObject = { ...prev };

                    if (!(newObject[filterKey] instanceof Array)) {
                      newObject[filterKey] = [];
                    }

                    const values = newObject[filterKey];
                    const idx = values.indexOf(bucket.key);

                    if (checked) {
                      if (idx === -1) {
                        values.push(bucket.key);
                      }
                    } else {
                      if (idx > -1) {
                        values.splice(idx, 1);
                      }

                      if (values.length === 0) {
                        delete newObject[filterKey];
                      }
                    }

                    return Object.keys(newObject).length > 0 ? newObject : null;
                  });
                }}
              />
              {bucket.key}
            </label>

            <Badge variant="outline">{bucket.doc_count}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
