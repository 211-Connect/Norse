import { getPathname, usePathname, useRouter } from '@/i18n/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const DOTS = 'dots';

function range(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => index + start);
}

export function CustomPagination({
  total,
  siblings,
  boundaries,
  activePage,
  totalResults,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = async (newPage: number) => {
    const queryEntries = searchParams?.entries() ?? [];
    const query = Object.fromEntries(queryEntries);
    await router.push({
      pathname,
      query: {
        ...query,
        page: newPage,
      },
    });

    const resultTotal = document.getElementById('result-total');
    if (resultTotal) resultTotal.scrollIntoView();
  };

  const getPagination = useCallback(() => {
    const _total = Math.max(Math.trunc(total), 0);

    const totalPageNumbers = siblings * 2 + 3 + boundaries * 2;
    if (totalPageNumbers >= _total) {
      return range(1, _total);
    }

    const leftSiblingIndex = Math.max(activePage - siblings, boundaries);
    const rightSiblingIndex = Math.min(
      activePage + siblings,
      _total - boundaries,
    );

    const shouldShowLeftDots = leftSiblingIndex > boundaries + 2;
    const shouldShowRightDots = rightSiblingIndex < _total - (boundaries + 1);

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = siblings * 2 + boundaries + 2;
      return [
        ...range(1, leftItemCount),
        DOTS,
        ...range(_total - (boundaries - 1), _total),
      ];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = boundaries + 1 + 2 * siblings;
      return [
        ...range(1, boundaries),
        DOTS,
        ...range(_total - rightItemCount, _total),
      ];
    }

    return [
      ...range(1, boundaries),
      DOTS,
      ...range(leftSiblingIndex, rightSiblingIndex),
      DOTS,
      ...range(_total - boundaries + 1, _total),
    ];
  }, [total, activePage, boundaries, siblings]);

  return (
    total > 1 && (
      <Pagination>
        <PaginationContent>
          {activePage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href=""
                onClick={async (e) => {
                  e.preventDefault();
                  await changePage(activePage - 1);
                }}
              />
            </PaginationItem>
          )}

          {getPagination()?.map((val, idx) => {
            if (val === DOTS) {
              return (
                <PaginationItem key={idx}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={idx}>
                <PaginationLink
                  href=""
                  onClick={async (e) => {
                    e.preventDefault();
                    await changePage(Number(val));
                  }}
                  isActive={val === activePage}
                >
                  {val}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {totalResults > 1 && activePage !== total && (
            <PaginationItem>
              <PaginationNext
                href=""
                onClick={async (e) => {
                  e.preventDefault();
                  await changePage(activePage + 1);
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    )
  );
}
