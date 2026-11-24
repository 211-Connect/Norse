'use client';

import dynamic from 'next/dynamic';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { useSearchResults } from '../context/search-results-context';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { usesV2Results } from '../utils/uses-v2-results';
import { CardLayoutRenderer } from './card-layout-renderer';
import { NoResultsCard } from './no-results-card';

type RenderResultsProps = {
  cardLayout: SearchCardLayoutConfig;
};

// v2 only: the v2 list (and the demo vocabulary it reads) is a separate chunk. A v1 tenant never loads it.
const RenderResultsV2 = dynamic(() =>
  import('./render-results-v2').then((m) => m.RenderResultsV2),
);

export function RenderResults({ cardLayout }: RenderResultsProps) {
  const appConfig = useAppConfig();
  if (usesV2Results(appConfig)) {
    return <RenderResultsV2 cardLayout={cardLayout} />;
  }
  return <RenderResultsV1 cardLayout={cardLayout} />;
}

function RenderResultsV1({ cardLayout }: RenderResultsProps) {
  const { results } = useSearchResults();

  return (
    <>
      {results.length === 0 && <NoResultsCard />}
      {results.map((result) => (
        <CardLayoutRenderer
          key={result._id}
          result={result}
          layout={cardLayout}
        />
      ))}
    </>
  );
}
