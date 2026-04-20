'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import { Label } from '@/app/(app)/shared/components/ui/label';
import { useTranslation } from 'react-i18next';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { useAtomValue } from 'jotai';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { useTopLoader } from 'nextjs-toploader';
import {
  getSortOption,
  SortOption,
} from '@/app/(app)/shared/utils/getSortOption';

const SORT_LABEL: Record<SortOption, string> = {
  relevance: 'Most Relevant',
  name: 'Resource Name',
  organization: 'Provider Name',
  distance: 'Nearest First',
};

const SORT_SELECT_TRIGGER_ID = 'sort-select';
const SORT_SELECT_CONTENT_ID = 'sort-select-content';

export function SortSelect() {
  const { t } = useTranslation('page-search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const coords = useAtomValue(userCoordinatesAtom);
  const showServiceName = useFlag('showSearchAndResourceServiceName');
  const { start } = useTopLoader();
  const [open, setOpen] = useState(false);

  const currentSort = getSortOption(searchParams.get('sort'), coords);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('sort', value);

    // Reset to page 1 when sorting changes
    params.delete('page');

    start();
    router.push(`${pathname}?${params.toString()}`);
  };

  const sortOptions = [
    { value: 'relevance', label: SORT_LABEL.relevance },
    { value: 'name', label: SORT_LABEL.name },
    ...(showServiceName
      ? [{ value: 'organization', label: SORT_LABEL.organization }]
      : []),
    ...(Array.isArray(coords) && coords.length === 2
      ? [{ value: 'distance', label: SORT_LABEL.distance }]
      : []),
  ];

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={SORT_SELECT_TRIGGER_ID} className="text-sm font-medium">
        {t('sort.label', 'Sort by')}:
      </Label>
      {!open && (
        <div
          id={SORT_SELECT_CONTENT_ID}
          role="listbox"
          hidden
          aria-hidden="true"
        />
      )}
      <Select
        value={currentSort}
        onValueChange={handleSortChange}
        contentId={SORT_SELECT_CONTENT_ID}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger
          id={SORT_SELECT_TRIGGER_ID}
          className="h-8 w-[180px] bg-white"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(`sort.options.${option.value}`, option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
