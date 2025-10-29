'use client';

import { CustomPagination } from '@/app/(app)/shared/components/custom-pagination';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/app/(app)/shared/store/results';
import { useAtomValue } from 'jotai';

export function ResultsPagination() {
  const appConfig = useAppConfig();
  const totalResults = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);

  const limit = appConfig?.search?.resultsLimit ?? 1;
  const totalPages = Math.ceil(totalResults / limit);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="print:hidden">
      <CustomPagination
        total={totalPages}
        totalResults={totalResults}
        activePage={currentPage}
        siblings={1}
        boundaries={1}
      />
    </div>
  );
}
