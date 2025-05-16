'use client';
import { useAppConfig } from '@/lib/context/app-config-context';
import { CustomPagination } from '@/shared/components/custom-pagination';

type ResultsPaginationProps = {
  page: number;
  total: number;
};

export function ResultsPagination({
  page = 1,
  total = 0,
}: ResultsPaginationProps) {
  const appConfig = useAppConfig();

  const limit = appConfig.search?.resultsLimit ?? 25;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="print:hidden">
      <CustomPagination
        total={totalPages}
        totalResults={total}
        activePage={page}
        siblings={1}
        boundaries={1}
      />
    </div>
  );
}
