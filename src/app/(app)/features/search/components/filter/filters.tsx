'use client';

import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { Separator } from '@/app/(app)/shared/components/ui/separator';

import { FilterGroup } from './filter-group';
import { FiltersProps } from './types';
import { useFilterActions } from './use-filter-actions';

export function Filters({
  idPrefix,
  filters,
  filterKeys,
  facetUiConfig,
}: FiltersProps) {
  const { t } = useTranslation();
  const { isPending, activeFilters, applyFilters, toggleFilter } =
    useFilterActions();

  if (filterKeys.length === 0) return null;

  return (
    <div className="py-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{t('filters', 'Filters')}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => applyFilters()}
          disabled={isPending}
        >
          {t('clear_filters', 'Clear filters')}
        </Button>
      </div>

      <Separator className="mb-4" />

      <div className="flex flex-col gap-4">
        {filterKeys.map((key) => (
          <FilterGroup
            key={key}
            idPrefix={idPrefix}
            facetKey={key}
            heading={filters[key].name}
            buckets={filters[key].buckets}
            excludedForKey={facetUiConfig.excludedValues.get(key)}
            currentFilters={activeFilters}
            isPending={isPending}
            onToggle={toggleFilter}
            sortMode={facetUiConfig.sortModes.get(key) ?? 'count'}
            customValueOrder={facetUiConfig.customValueOrders.get(key)}
          />
        ))}
      </div>
    </div>
  );
}
