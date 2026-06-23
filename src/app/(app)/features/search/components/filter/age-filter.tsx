'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';

import { useSearchResultsNavigation } from './use-search-results-navigation';

export const AgeFilter = () => {
  const { t } = useTranslation();
  const { isPending, searchParamsObject, updateSearchParams } =
    useSearchResultsNavigation();
  const currentAge =
    typeof searchParamsObject.age === 'string' ? searchParamsObject.age : '';

  const applyAge = useCallback(
    (value: string) => {
      if (value === currentAge) {
        return;
      }

      const parsed = parseInt(value, 10);

      updateSearchParams((params) => {
        if (!value || isNaN(parsed)) {
          const next = { ...params };
          delete next.age;
          return next;
        }
        const normalized = Math.min(Math.max(parsed, 0), 200);
        return { ...params, age: String(normalized) };
      });
    },
    [updateSearchParams, currentAge],
  );

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="age-filter-input" className="text-sm font-medium">
        {t('age_filter_label', 'Filter by age')}:
      </Label>
      <Input
        key={currentAge}
        id="age-filter-input"
        type="number"
        min={0}
        max={200}
        defaultValue={currentAge}
        className="h-auto w-31.25 py-1.25 text-sm"
        disabled={isPending}
        onBlur={(e) => applyAge(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </div>
  );
};
