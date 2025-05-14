import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { Filter } from './filter';
import { useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';

export const Filters = ({ filters, filterKeys }) => {
  const t = useTranslations('common');
  const [, setFilters] = useQueryState('filters', {
    shallow: false,
  });

  const clearFilters = () => {
    setFilters(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{t('filters')}</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          {t('clear_filters')}
        </Button>
      </div>

      <Separator className="mb-4" />

      <div className="flex flex-col gap-4">
        {filterKeys.map((key) => {
          return <Filter key={key} filters={filters} filterKey={key} />;
        })}
      </div>
    </div>
  );
};
