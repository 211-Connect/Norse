import { useAppConfig } from '@/lib/context/app-config-context';
import { useTranslations } from 'next-intl';

type ResultTotalProps = {
  page: number;
  total: number;
};

export function ResultTotal({ page = 1, total = 0 }: ResultTotalProps) {
  const t = useTranslations('page');
  const appConfig = useAppConfig();

  const limit = appConfig.search?.resultsLimit ?? 25;

  const counterStart = Math.round(
    Math.abs(Math.min(Math.max(page * limit - limit + 1, 0), total)),
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(page * limit, 0), total)),
  );

  return (
    <div id="result-total">
      {counterStart}-{counterEnd}
      {` `}
      {t('of')}
      {` `}
      {total.toLocaleString()}
    </div>
  );
}
