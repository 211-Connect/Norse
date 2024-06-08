import { NoResultsCard } from './components/no-results-card';
import { Result } from './components/result';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import ResultsHeader from './components/header';
import ResultsPagination from './components/pagination';
import { ISearchResult } from '@/types/search-result';

type Props = {
  results: ISearchResult[];
  currentPage: number;
  noResults: boolean;
  totalResults: number;
  totalFilters: number;
};

export function Results(props: Props) {
  const { status } = useSession();
  const router = useRouter();
  const total = Math.ceil(props.totalResults / 25);

  return (
    <>
      <ResultsHeader
        totalFilters={props.totalFilters}
        currentPage={props.currentPage}
        totalResults={props.totalResults}
      />

      <div className="flex flex-col gap-2 pb-2 pl-2 pr-2">
        {props.noResults && (
          <NoResultsCard showAltSubtitle={props.totalResults === 0} />
        )}

        {props.results.map((result) => {
          return (
            <Result
              key={result.id}
              id={result.id}
              service={{
                name: result.service.name,
              }}
              name={result.name}
              description={result.description}
              phone={result.phone}
              website={result.website}
              address={result.address}
              location={result.location}
              sessionStatus={status}
              router={router}
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
