import { ResultTotal } from './result-total';
import { RenderResults } from './render-results';
import { ResultsPagination } from './results-pagination';
import { useAtomValue } from 'jotai';
import { noResultsAtom } from '@/shared/store/results';
import { useRef } from 'react';
import { PrintButton } from '@/shared/components/print-button';
import { ShareButton } from '@/shared/components/share-button';

export function ResultsSection() {
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const noResults = useAtomValue(noResultsAtom);

  return (
    <div
      id="search-container"
      className="flex w-full flex-col gap-3 overflow-y-auto p-[10px] lg:max-w-[550px]"
    >
      <div className="flex items-center justify-between py-[5.5px] print:hidden">
        <ResultTotal />
        <div className="flex gap-[10px]">
          {!noResults && (
            <PrintButton componentToPrintRef={componentToPrintRef} />
          )}
          <ShareButton componentToPrintRef={componentToPrintRef} />
        </div>
      </div>

      <div className="flex flex-col gap-6" ref={componentToPrintRef}>
        <RenderResults />
        <ResultsPagination />
      </div>
    </div>
  );
}
