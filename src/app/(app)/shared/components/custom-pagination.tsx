'use client';

import { usePathname } from 'next/navigation';
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
import { useClientSearchParams } from '../hooks/use-client-search-params';

const DOTS = 'dots';

function range(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => index + start);
}

interface CustomPaginationProps {
  total: number;
  siblings: number;
  boundaries: number;
  activePage: number;
  totalResults: number;
  onPageChange?: (page: number) => void;
  focusTargetId?: string;
}

export function CustomPagination({
  total,
  siblings,
  boundaries,
  activePage,
  totalResults,
  onPageChange,
  focusTargetId,
}: CustomPaginationProps) {
  const pathname = usePathname();
  const { stringifiedSearchParams, stringifySearchParams } =
    useClientSearchParams();

  const queueFocus = useCallback((targetId?: string) => {
    if (typeof window === 'undefined' || !targetId) return;
    window.sessionStorage.setItem('pending-search-focus-target', targetId);
  }, []);

  const createPageHref = useCallback(
    (page: number) => {
      const newSearchParams = new URLSearchParams(stringifiedSearchParams);
      newSearchParams.set('page', page.toString());
      return `${pathname}${stringifySearchParams(newSearchParams)}`;
    },
    [pathname, stringifiedSearchParams, stringifySearchParams],
  );

  const changePage = useCallback((newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  }, [onPageChange]);

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
                href={createPageHref(activePage - 1)}
                onClick={(e) => {
                  if (onPageChange) {
                    e.preventDefault();
                    changePage(activePage - 1);
                    return;
                  }

                  queueFocus(focusTargetId);
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
                  className="h-[30px] w-[36px]"
                  href={createPageHref(Number(val))}
                  aria-label={
                    val === activePage
                      ? `Page ${val}, current page`
                      : `Go to page ${val}`
                  }
                  onClick={(e) => {
                    if (onPageChange) {
                      e.preventDefault();
                      changePage(Number(val));
                      return;
                    }

                    queueFocus(focusTargetId);
                  }}
                  isActive={val === activePage}
                >
                  {val}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {totalResults > 0 && activePage !== total && (
            <PaginationItem>
              <PaginationNext
                href={createPageHref(activePage + 1)}
                onClick={(e) => {
                  if (onPageChange) {
                    e.preventDefault();
                    changePage(activePage + 1);
                    return;
                  }

                  queueFocus(focusTargetId);
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    )
  );
}
