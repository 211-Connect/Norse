'use client';

import { useSearchResults } from '../context/search-results-context';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { CardLayoutRenderer } from './card-layout-renderer';
import { NoResultsCard } from './no-results-card';

type RenderResultsProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function RenderResults({ cardLayout }: RenderResultsProps) {
  const { results } = useSearchResults();

  return (
    <>
      {results.length === 0 && <NoResultsCard />}
      {results.map((result) => (
        // Prototype: a marker with no box, so the help button can find the 3rd card.
        <div key={result._id} className="contents" data-search-result>
          <CardLayoutRenderer result={result} layout={cardLayout} />
        </div>
      ))}
    </>
  );
}
