'use client';

import { CustomPagination } from '@/app/(app)/shared/components/custom-pagination';
import {
  favoriteListsCurrentPageAtom,
  favoriteListsTotalAtom,
  favoriteListLimitAtom,
} from '@/app/(app)/shared/store/favorites';
import { useAtomValue } from 'jotai';

export function FavoritesPagination() {
  const totalResults = useAtomValue(favoriteListsTotalAtom);
  const currentPage = useAtomValue(favoriteListsCurrentPageAtom);
  const limit = useAtomValue(favoriteListLimitAtom);

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
