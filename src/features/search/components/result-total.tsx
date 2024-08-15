import {
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/shared/store/results';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';

export function ResultTotal() {
  const { t } = useTranslation();
  const resultTotal = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);

  const counterStart = Math.round(
    Math.abs(Math.min(Math.max(currentPage * 25 - 25 + 1, 0), resultTotal)),
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(currentPage * 25, 0), resultTotal)),
  );

  return (
    <div id="result-total">
      {counterStart}-{counterEnd}
      {` `}
      {t('of')}
      {` `}
      {resultTotal}
    </div>
  );
}
