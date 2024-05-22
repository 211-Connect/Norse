import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { IconAdjustments } from '@tabler/icons-react';
import { NoResultsCard } from '../molecules/no-results-card';
import { Result } from '../molecules/result';
import { useRouter } from 'next/router';
import { Search } from '../molecules/search';
import { useTranslation } from 'next-i18next';
import { useFilterPanelStore } from '../../lib/state/filterPanel';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { IResult } from '../../lib/adapters/SearchAdapter';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type Props = {
  results: IResult[];
  currentPage: number;
  noResults: boolean;
  totalResults: number;
  totalFilters: number;
};

function range(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => index + start);
}

export function ResultsSection(props: Props) {
  const { status } = useSession();
  const filterPanel = useFilterPanelStore();
  const router = useRouter();
  const { t } = useTranslation('page-search');
  const coordinates = useMemo(() => {
    return ((router.query?.coords as string) ?? '')
      .split(',')
      .slice()
      .reverse()
      .join(',');
  }, [router.query.coords]);

  const changePage = async (newPage: number) => {
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        page: newPage,
      },
    });

    const resultTotal = document.getElementById('result-total');
    if (resultTotal) resultTotal.scrollIntoView();
  };

  const counterStart = Math.round(
    Math.abs(
      Math.min(Math.max(props.currentPage * 25 - 25 + 1, 0), props.totalResults)
    )
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(props.currentPage * 25, 0), props.totalResults))
  );

  const total = Math.ceil(props.totalResults / 25);
  const _total = Math.max(Math.trunc(total), 0);
  const activePage = props.currentPage;
  const siblings = 1;
  const boundaries = 1;
  const DOTS = 'dots';

  function getPagination() {
    const totalPageNumbers = siblings * 2 + 3 + boundaries * 2;
    if (totalPageNumbers >= _total) {
      return range(1, _total);
    }

    const leftSiblingIndex = Math.max(activePage - siblings, boundaries);
    const rightSiblingIndex = Math.min(
      activePage + siblings,
      _total - boundaries
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
  }

  return (
    <>
      <div className="p-2 pb-0">
        <Search />
      </div>

      <div
        className={cn(
          props.totalFilters > 0 ? 'justify-between' : 'justify-end',
          'flex bg-primary items-center p-1 pr-2 pl-2'
        )}
      >
        {props.totalFilters > 0 && (
          <Button
            className="flex gap-1 items-center md:hidden"
            onClick={filterPanel.toggle}
          >
            <IconAdjustments /> {t('filter_results')}
          </Button>
        )}

        <p id="result-total" className="text-primary-foreground">
          {counterStart}-{counterEnd}
          {` `}
          {t('of')}
          {` `}
          {props.totalResults.toLocaleString()}
        </p>
      </div>

      <div className="flex flex-col gap-2 pl-2 pr-2">
        {props.noResults && (
          <NoResultsCard
            router={router}
            showAltSubtitle={props.totalResults === 0}
          />
        )}

        {props.results.map((result) => {
          return (
            <Result
              key={result._id}
              id={result.id}
              serviceName={result.serviceName}
              name={result.name}
              description={result.description}
              phone={result.phone}
              website={result.website}
              address={result.address}
              location={result.location}
              sessionStatus={status}
              router={router}
              coordinates={coordinates}
            />
          );
        })}

        {total > 1 && (
          <Pagination>
            <PaginationContent>
              {props.currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      await changePage(props.currentPage - 1);
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
                      href="#"
                      onClick={async (e) => {
                        e.preventDefault();
                        await changePage(Number(val));
                      }}
                      isActive={val === props.currentPage}
                    >
                      {val}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {props.totalResults > 1 && props.currentPage !== total && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      await changePage(props.currentPage + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  );
}
