'use client';

import { CustomPagination } from '@/app/(app)/shared/components/custom-pagination';
import { favoriteListsStateAtom } from '@/app/(app)/shared/store/favorites';
import { useAtomValue } from 'jotai';

export interface FavoritesPaginationProps {
  siblings?: number;
  boundaries?: number;
}

export function FavoritesPagination({
  siblings = 1,
  boundaries = 1,
}: FavoritesPaginationProps) {
  const {
    totalCount: totalResults,
    currentPage,
    limit,
  } = useAtomValue(favoriteListsStateAtom);

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
        siblings={siblings}
        boundaries={boundaries}
      />
    </div>
  );
}
