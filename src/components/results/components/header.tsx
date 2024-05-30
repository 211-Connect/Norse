import { useTranslation } from 'next-i18next';
import { Button } from '../../ui/button';
import { cn } from '@/utils';
import { IconAdjustments } from '@tabler/icons-react';
import { filterPanelAtom } from './filter-panel';
import { useSetAtom } from 'jotai';

export default function ResultsHeader({
  totalFilters,
  currentPage,
  totalResults,
}) {
  const { t } = useTranslation('page-search');
  const setFilterPanel = useSetAtom(filterPanelAtom);

  const counterStart = Math.round(
    Math.abs(Math.min(Math.max(currentPage * 25 - 25 + 1, 0), totalResults)),
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(currentPage * 25, 0), totalResults)),
  );

  return (
    <div
      className={cn(
        totalFilters > 0 ? 'justify-between' : 'justify-end',
        'flex bg-primary items-center p-1 pr-2 pl-2 mb-2',
      )}
    >
      {totalFilters > 0 && (
        <Button
          className="flex gap-1 items-center lg:hidden text-primary-foreground"
          size="sm"
          variant="link"
          onClick={() =>
            setFilterPanel((prev) => ({
              ...prev,
              isOpen: !prev.isOpen,
            }))
          }
        >
          <IconAdjustments className="size-4" /> {t('filter_results')}
        </Button>
      )}

      <p id="result-total" className="text-primary-foreground">
        {counterStart}-{counterEnd}
        {` `}
        {t('of')}
        {` `}
        {totalResults.toLocaleString()}
      </p>
    </div>
  );
}
