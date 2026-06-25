'use client';

import { useTranslation } from 'react-i18next';

import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';

import { FilterOptionRowProps } from './types';

export function FilterOptionRow({
  bucket,
  checkboxId,
  countId,
  checked,
  disabled,
  onToggle,
  checkboxRef,
}: FilterOptionRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-sm" htmlFor={checkboxId}>
        <Checkbox
          ref={checkboxRef}
          aria-describedby={countId}
          id={checkboxId}
          disabled={disabled}
          checked={checked}
          onCheckedChange={(nextChecked) => onToggle(!!nextChecked)}
        />
        {bucket.display}
      </label>
      <Badge className="bg-[rgba(0,0,0,0.03)]" variant="outline">
        <span id={countId}>
          <span aria-hidden="true">{bucket.doc_count}</span>
          <span className="sr-only">
            {t('filter_results_count', {
              count: bucket.doc_count,
            })}
          </span>
        </span>
      </Badge>
    </div>
  );
}
