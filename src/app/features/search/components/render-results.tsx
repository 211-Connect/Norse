'use client';

import { noResultsAtom, resultsAtom } from '@/app/shared/store/results';
import { useAtomValue } from 'jotai';

import { Result } from './result';
import { NoResultsCard } from './no-results-card';

export function RenderResults() {
  const results = useAtomValue(resultsAtom);
  const noResults = useAtomValue(noResultsAtom);

  return (
    <>
      {results?.map((result) => <Result key={result._id} data={result} />)}
      {noResults && <NoResultsCard showAltSubtitle={results?.length === 0} />}
    </>
  );
}
