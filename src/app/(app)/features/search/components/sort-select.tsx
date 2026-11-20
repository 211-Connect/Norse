'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import { useTranslation } from 'react-i18next';

import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';

import { useSearchResults } from '../context/search-results-context';
import { sortLabel, sortOptionValues } from '../utils/sort-options';
import { sortHref } from '../utils/sortHref';
import { useV2Search } from '../v2/use-v2-search';

const SORT_SELECT_TRIGGER_ID = 'sort-select';
const SORT_SELECT_CONTENT_ID = 'sort-select-content';

export function SortSelect() {
  const { t } = useTranslation('page-search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Both come from the server-parsed URL so the label matches the order the
  // results were actually returned in, including during SSR.
  const { sort: currentSort, hasSearchCoordinates } = useSearchResults();
  const showServiceName = useFlag('showSearchAndResourceServiceName');
  const { start } = useTopLoader();

  const handleSortChange = (value: string) => {
    start();
    router.push(sortHref(pathname, searchParams, value));
  };

  const { query } = useV2Search();
  const isV2 = Boolean(query);
  // v2 labels live under `sort.v2_options`; v1 keeps `sort.options`.
  const labelKey = isV2 ? 'sort.v2_options' : 'sort.options';
  const sortOptions = sortOptionValues({
    isV2,
    showServiceName,
    hasCoordinates: hasSearchCoordinates,
  }).map((value) => ({ value, label: sortLabel(value, isV2) }));

  return (
    <div className="flex items-center gap-2">
      <Select
        a11yLabel={
          <Label
            htmlFor={SORT_SELECT_TRIGGER_ID}
            className="text-sm font-medium"
          >
            {t('sort.label', 'Sort by')}:
          </Label>
        }
        contentId={SORT_SELECT_CONTENT_ID}
        onValueChange={handleSortChange}
        value={currentSort}
      >
        <SelectTrigger
          id={SORT_SELECT_TRIGGER_ID}
          className="h-8 w-auto min-w-[180px] gap-2 bg-white"
        >
          {/* Explicit children: Radix only fills SelectValue from the selected
              item after mount, which leaves the SSR trigger empty. */}
          <SelectValue>
            {t(`${labelKey}.${currentSort}`, sortLabel(currentSort, isV2))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(`${labelKey}.${option.value}`, option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
