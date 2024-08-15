import { resultsAtom } from '@/shared/store/results';
import { useAtomValue } from 'jotai';
import { Result } from './result';

export function RenderResults() {
  const results = useAtomValue(resultsAtom);

  return (
    <>{results?.map((result) => <Result key={result._id} data={result} />)}</>
  );
}
