import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { ResultTotal } from './result-total';
import { RenderResults } from './render-results';

export function ResultsSection() {
  return (
    <div
      id="search-container"
      className="flex w-full flex-col overflow-y-auto sm:max-w-[550px]"
    >
      <div className="bg-white p-2">
        <MainSearchLayout />
      </div>

      <div className="flex justify-between bg-primary p-1 pl-2 pr-2 text-primary-foreground">
        <div></div>

        <ResultTotal />
      </div>

      <div className="flex flex-col gap-2 p-2">
        <RenderResults />
      </div>
    </div>
  );
}
