import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies from 'nookies';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '../../lib/constants/cookies';
import { useEffect } from 'react';
import { useEventStore } from '../../lib/hooks/useEventStore';
import { AppHeader } from '../../components/organisms/app-header';
import { AppFooter } from '../../components/organisms/app-footer';
import { FilterPanel } from '../../components/organisms/filter-panel';
import { ResultsSection } from '../../components/organisms/results-section';
import { PluginLoader } from '../../components/molecules/plugin-loader';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { useTranslation } from 'next-i18next';
import { cacheControl } from '../../lib/server/cache-control';
import SearchAdapter, {
  SearchQueryParams,
} from '@/lib/server/adapters/search-adapter';
import Head from 'next/head';
import { useMediaQuery, useWindowScroll } from '@mantine/hooks';

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

  const searchAdapter = SearchAdapter();
  const { results, noResults, totalResults, page, filters } =
    await searchAdapter.search({
      ...(ctx.query as SearchQueryParams),
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
  // const session = useSession();
  const appConfig = useAppConfig();
  const { createResultsEvent } = useEventStore();
  const { t } = useTranslation('page-search');
  const [scroll] = useWindowScroll();
  const mapHidden = useMediaQuery('(max-width: 768px)');

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(scroll.y, 0), 80) - 80)
  );

  useEffect(() => {
    if (mapHidden) return;
    window.dispatchEvent(new Event('resize'));
  }, [clampedWindowValue, mapHidden]);

  useEffect(() => {
    createResultsEvent({ results: props.results, total: props.totalResults });
  }, [props.results, createResultsEvent, props.totalResults]);

  const metaTitle = `${
    props.query_label || props.query || t('no_query')
  } - ${props.totalResults.toLocaleString()} ${t('results')}`;

  const metaDescription = `Showing ${
    props.results.length >= 25 ? '25' : props.results.length
  } / ${props.totalResults} ${t('results_for')} ${props.query}.`;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={metaDescription} />
      </Head>

      <AppHeader fullWidth />

      <div className="w-full h-full flex relative gap-2">
        <FilterPanel filters={props.filters} />

        <div
          className="flex flex-col gap-2 md:max-w-xl w-full overflow-y-auto"
          id="search-container"
        >
          <ResultsSection
            results={props.results}
            noResults={props.noResults}
            currentPage={props.currentPage}
            totalResults={props.totalResults}
            totalFilters={props.filters ? Object.keys(props.filters).length : 0}
          />
        </div>

        <div className="hidden w-full md:block">
          <div
            className="w-full flex sticky top-2 mt-2 pr-2"
            id="map-container"
            style={{
              height: `calc(100vh - ${clampedWindowValue}px - 16px)`,
            }}
          >
            <div className="w-full h-full relative rounded-md overflow-hidden">
              <PluginLoader
                plugin={appConfig?.features?.map?.plugin}
                component="map"
                locations={props.results}
              />
            </div>
          </div>
        </div>
      </div>
      <AppFooter fullWidth />
    </>
  );
}
