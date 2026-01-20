'use client';

import { noResultsAtom, resultsAtom } from '@/app/(app)/shared/store/results';
import { useAtomValue } from 'jotai';

import { Result } from './result';
import { NoResultsCard } from './no-results-card';

export function RenderResults() {
  const results = useAtomValue(resultsAtom);
  const noResults = useAtomValue(noResultsAtom);

  return (
    <>
      {noResults && <NoResultsCard showAltSubtitle={results?.length === 0} />}
      {results?.map((result) => (
        <Result key={result._id} data={result} />
      ))}
    </>
  );
}
