import { NoResultsCard } from '../no-results-card';
import { Result } from '../result';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { IResult } from '../../lib/adapters/SearchAdapter';
import ResultsHeader from './header';
import ResultsPagination from './pagination';

type Props = {
  results: IResult[];
  currentPage: number;
  noResults: boolean;
  totalResults: number;
  totalFilters: number;
};

export function Results(props: Props) {
  const { status } = useSession();
  const router = useRouter();

  const coordinates = useMemo(() => {
    return ((router.query?.coords as string) ?? '')
      .split(',')
      .slice()
      .reverse()
      .join(',');
  }, [router.query.coords]);

  const total = Math.ceil(props.totalResults / 25);
  const _total = Math.max(Math.trunc(total), 0);
  const activePage = props.currentPage;
  const siblings = 1;
  const boundaries = 1;

  return (
    <>
      <ResultsHeader
        totalFilters={props.totalFilters}
        currentPage={props.currentPage}
        totalResults={props.totalResults}
      />

      <div className="flex flex-col gap-2 pl-2 pr-2 pb-2">
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

        <ResultsPagination
          total={total}
          siblings={1}
          boundaries={1}
          activePage={props.currentPage}
          totalResults={props.totalResults}
        />
      </div>
    </>
  );
}