import { useTranslation } from 'next-i18next';
import { Button } from '../../ui/button';
import { cn } from '@/lib/utils';
import { filterPanelAtom } from './filter-panel';
import { useSetAtom } from 'jotai';
import { Filter } from 'lucide-react';

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
    <div className={cn('mb-2 flex items-center bg-primary p-1 pl-2 pr-2')}>
      {totalFilters > 0 && (
        <Button
          className="flex items-center gap-1 text-primary-foreground lg:hidden"
          size="sm"
          variant="link"
          onClick={() =>
            setFilterPanel((prev) => ({
              ...prev,
              isOpen: !prev.isOpen,
            }))
          }
        >
          <Filter className="size-4" /> {t('filter_results')}
        </Button>
      )}

      <p id="result-total" className="ml-auto text-primary-foreground">
        {counterStart}-{counterEnd}
        {` `}
        {t('of')}
        {` `}
        {totalResults.toLocaleString()}
      </p>
    </div>
  );
}
