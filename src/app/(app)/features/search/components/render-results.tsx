'use client';

import { resultsAtom } from '@/app/(app)/shared/store/results';
import { useAtomValue } from 'jotai';

import { NoResultsCard } from './no-results-card';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { CardLayoutRenderer } from './card-layout-renderer';

type RenderResultsProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function RenderResults({ cardLayout }: RenderResultsProps) {
  const results = useAtomValue(resultsAtom);

  return (
    <>
      {results?.length === 0 && <NoResultsCard />}
      {results?.map((result) => (
        <CardLayoutRenderer
          key={result._id}
          result={result}
          layout={cardLayout}
        />
      ))}
    </>
  );
}
