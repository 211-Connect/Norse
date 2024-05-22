import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies from 'nookies';
import { SearchPageLayout } from '../../components/layouts/SearchPage';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '../../lib/constants/cookies';
import { useEffect } from 'react';
import { useEventStore } from '../../lib/hooks/useEventStore';
import { AppHeader } from '../../components/organisms/app-header';
import { AppFooter } from '../../components/organisms/app-footer';
import { FilterPanel } from '../../components/organisms/FilterPanel';
import { ResultsSection } from '../../components/organisms/ResultsSection';
import { PluginLoader } from '../../components/molecules/PluginLoader';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { SearchAdapter } from '../../lib/adapters/SearchAdapter';
import { getServerSideAxios } from '../../lib/server/axios';
import { useTranslation } from 'next-i18next';
import { cacheControl } from '../../lib/server/cacheControl';
import { useSession } from 'next-auth/react';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = nookies.get(ctx);

  // If the user already has a location and coords, but they aren't present in the query
  // redirect them to the url using their stored location and coords
  if (!ctx.query.location || !ctx.query.coords) {
    if (cookies[USER_PREF_LOCATION] && cookies[USER_PREF_COORDS]) {
      const newQuery = new URLSearchParams(ctx.resolvedUrl.split('?')[1]);
      newQuery.set('location', cookies[USER_PREF_LOCATION]);
      newQuery.set('coords', cookies[USER_PREF_COORDS]);

      return {
        redirect: {
          destination: `/${ctx.locale}/search?${newQuery.toString()}`,
          permanent: false,
        },
      };
    }
  }

  const axios = getServerSideAxios(ctx);
  const searchAdapter = new SearchAdapter(axios);
  const { results, noResults, totalResults, page, filters } =
    await searchAdapter.search(ctx.query, Number(ctx.query.page), {
      locale: ctx.locale,
    });

  cacheControl(ctx);

  return {
    props: {
      results,
      noResults,
      filters,
      totalResults,
      currentPage: page,
      query: ctx.query?.query ?? null,
      query_label: ctx.query?.query_label ?? null,
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-search',
        'common',
        'dynamic',
      ])),
    },
  };
}

export default function Search(props: any) {
  const session = useSession();
  const appConfig = useAppConfig();
  const { createResultsEvent } = useEventStore();
  const { t } = useTranslation('page-search');

  useEffect(() => {
    createResultsEvent({ results: props.results, total: props.totalResults });
  }, [props.results, createResultsEvent, props.totalResults]);

  if (session.status === 'loading') return null;

  return (
    <SearchPageLayout
      metaTitle={`${
        props.query_label || props.query || t('no_query')
      } - ${props.totalResults.toLocaleString()} ${t('results')}`}
      metaDescription={`Showing ${
        props.results.length >= 25 ? '25' : props.results.length
      } / ${props.totalResults} ${t('results_for')} ${props.query}.`}
      headerSection={<AppHeader fullWidth />}
      filterPanelSection={<FilterPanel filters={props.filters} />}
      resultsSection={
        <ResultsSection
          results={props.results}
          noResults={props.noResults}
          currentPage={props.currentPage}
          totalResults={props.totalResults}
          totalFilters={props.filters ? Object.keys(props.filters).length : 0}
        />
      }
      mapSection={
        <PluginLoader
          plugin={appConfig?.features?.map?.plugin}
          component="map"
          locations={props.results}
        />
      }
      footerSection={<AppFooter fullWidth />}
    />
  );
}
