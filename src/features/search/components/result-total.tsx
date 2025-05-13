import { useAppConfig } from '@/lib/context/app-config-context';
import {
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/shared/store/results';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';

export function ResultTotal() {
  const { t } = useTranslation();
  const appConfig = useAppConfig();
  const resultTotal = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);

  const limit = appConfig.search?.resultsLimit ?? 25;

  const counterStart = Math.round(
    Math.abs(
      Math.min(Math.max(currentPage * limit - limit + 1, 0), resultTotal),
    ),
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(currentPage * limit, 0), resultTotal)),
  );

  return (
    <div id="result-total">
      {counterStart}-{counterEnd}
      {` `}
      {t('of')}
      {` `}
      {resultTotal.toLocaleString()}
    </div>
  );
}
