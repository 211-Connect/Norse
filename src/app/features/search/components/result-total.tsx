'use client';

import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import {
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/app/shared/store/results';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

export function ResultTotal() {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();
  const resultTotal = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);

  const limit = appConfig?.search?.resultsLimit ?? 0;

  const counterStart = Math.round(
    Math.abs(
      Math.min(Math.max(currentPage * limit - limit + 1, 0), resultTotal),
    ),
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(currentPage * limit, 0), resultTotal)),
  );

  return (
    <div id="result-total" className="text-sm">
      {counterStart}-{counterEnd}
      {` `}
      {t('of')}
      {` `}
      {resultTotal.toLocaleString()}
    </div>
  );
}
