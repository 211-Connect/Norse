import { CustomPagination } from '@/shared/components/custom-pagination';
import {
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/shared/store/results';
import { useAtomValue } from 'jotai';

export function ResultsPagination() {
  const totalResults = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);
  const totalPages = Math.ceil(totalResults / 25);

  return (
    <>
      <CustomPagination
        total={totalPages}
        totalResults={totalResults}
        activePage={currentPage}
        siblings={1}
        boundaries={1}
      />
    </>
  );
}
