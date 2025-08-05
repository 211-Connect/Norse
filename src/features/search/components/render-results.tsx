import { noResultsAtom, resultsAtom } from '@/shared/store/results';
import { useAtomValue } from 'jotai';
import { Result } from './result';
import { NoResultsCard } from './no-results-card';
import { PrintButton } from '@/shared/components/print-button';

export function RenderResults({ componentToPrintRef }) {
  const results = useAtomValue(resultsAtom);
  const noResults = useAtomValue(noResultsAtom);

  return (
    <>
      {!noResults && <PrintButton componentToPrintRef={componentToPrintRef} />}
      {results?.map((result) => <Result key={result._id} data={result} />)}
      {noResults && <NoResultsCard showAltSubtitle={results?.length === 0} />}
    </>
  );
}
