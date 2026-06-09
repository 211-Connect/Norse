'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';

export type AgeFilterProps = {
  isPending: boolean;
  searchParamsObject: Record<string, unknown>;
  updateSearchParams: (
    updater: (params: Record<string, unknown>) => Record<string, unknown>,
  ) => void;
};

export const AgeFilter = ({
  isPending,
  searchParamsObject,
  updateSearchParams,
}: AgeFilterProps) => {
  const { t } = useTranslation();
  const currentAge =
    typeof searchParamsObject.age === 'string' ? searchParamsObject.age : '';

  const applyAge = useCallback(
    (value: string) => {
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
    [updateSearchParams],
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
