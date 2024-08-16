import { useAppConfig } from '@/shared/hooks/use-app-config';
import { createResultsEvent } from '@/shared/lib/google-tag-manager';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useEffect } from 'react';
import { ResultsSection } from '../components/results-section';
import { MapContainer } from '../components/map-container';

export function SearchView({ results, totalResults, query_label, query }) {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();

  useEffect(() => {
    createResultsEvent({ results, total: totalResults });
  }, [results, totalResults]);

  return (
    <>
      <Head>
        <title>{`${
          query_label || query || t('no_query')
        } - ${totalResults?.toLocaleString()} ${t('results')}`}</title>
        <meta
          name="description"
          content={`Showing ${
            results.length >= 25 ? '25' : results.length
          } / ${totalResults} ${t('results_for')} ${query}.`}
        />
        <meta
          property="og:title"
          content={`${
            query_label || query || t('no_query')
          } - ${totalResults?.toLocaleString()} ${t('results')}`}
        />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content={`Showing ${
            results.length >= 25 ? '25' : results.length
          } / ${totalResults} ${t('results_for')} ${query}.`}
        />
      </Head>

      <div className="flex h-full w-full">
        <ResultsSection />
        <MapContainer />
      </div>
    </>
  );
}
