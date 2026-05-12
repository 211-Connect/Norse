'use client';

import { useAtomValue } from 'jotai';

import { resultsAtom } from '@/app/(app)/shared/store/results';

import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { CardLayoutRenderer } from './card-layout-renderer';
import { NoResultsCard } from './no-results-card';

type RenderResultsProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function RenderResults({ cardLayout }: RenderResultsProps) {
  const results = useAtomValue(resultsAtom);
  const hasHydratedResults = results !== null;
  const items = results ?? [];

  return (
    <>
      {hasHydratedResults && items.length === 0 && <NoResultsCard />}
      {items.map((result) => (
        <CardLayoutRenderer
          key={result._id}
          result={result}
          layout={cardLayout}
        />
      ))}
    </>
  );
}
