import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies, { destroyCookie, setCookie } from 'nookies';
import { useEffect, useMemo } from 'react';
import { useEventStore } from '@/hooks/use-event-store';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { FilterPanel } from '../../components/results/components/filter-panel';
import { useAppConfig } from '@/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import { cacheControl } from '../../lib/cache-control';
import Head from 'next/head';
import { Results } from '@/components/results';
import useMediaQuery from '@/hooks/use-media-query';
import useWindowScroll from '@/hooks/use-window-scroll';
import Search from '@/components/search';
import { serverSideAppConfig } from '@/lib/server-utils';
import {
  USER_PREF_BACK_ACTION,
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_LAST_QUERY,
  USER_PREF_LOCATION,
} from '@/constants/cookies';
import MapboxMap from '@/components/map';
import mapStyle from '@/components/map/style.json';
import { Style } from 'mapbox-gl';
import { getPublicConfig } from '../api/config';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { getSearchAdapter } from '@/lib/adapters/search/get-search-adapter';
import { ISearchResult } from '@/types/search-result';
import { Markers } from '@/components/results/components/map-markers';
import { transformQueryParams } from '@/lib/utils';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = nookies.get(ctx);
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (
    cookies[USER_PREF_LAST_QUERY] != null &&
    cookies[USER_PREF_BACK_ACTION] != null
  ) {
    destroyCookie(ctx, USER_PREF_BACK_ACTION, { path: '/' });
    let prefix = '';
    if (ctx.locale !== ctx.defaultLocale) {
      prefix += `/${ctx.locale}`;
    }

    let queryParamsString;
    try {
      queryParamsString = new URLSearchParams(
        JSON.parse(cookies[USER_PREF_LAST_QUERY]),
      ).toString();
    } catch (err) {
      queryParamsString = '';
    }

    return {
      redirect: {
        destination: `${prefix}/search?${queryParamsString}`,
        permanent: false,
      },
    };
  }

  // If the user already has a location and coords, but they aren't present in the query
  // redirect them to the url using their stored location and coords
  if (!ctx.query.location || !ctx.query.coords) {
    if (cookies[USER_PREF_LOCATION] && cookies[USER_PREF_COORDS]) {
      const newQuery = new URLSearchParams(ctx.resolvedUrl.split('?')[1]);
      newQuery.set('location', cookies[USER_PREF_LOCATION] || '');
      newQuery.set('coords', cookies[USER_PREF_COORDS] || '0,0');
      newQuery.set('distance', cookies[USER_PREF_DISTANCE] || '0');

      let prefix = '';
      if (ctx.locale !== ctx.defaultLocale) {
        prefix += `/${ctx.locale}`;
      }

      return {
        redirect: {
          destination: `${prefix}/search?${newQuery.toString()}`,
          permanent: false,
        },
      };
    }
  }

  if (Object.keys(ctx.query).length > 0) {
    setCookie(ctx, USER_PREF_LAST_QUERY, JSON.stringify(ctx.query), {
      path: '/',
    });
  } else {
    destroyCookie(ctx, USER_PREF_LAST_QUERY, { path: '/' });
  }

  const searchAdapter = await getSearchAdapter();
  const { results, totalResults, page, facets } = await searchAdapter.search({
    ...transformQueryParams(ctx.query),
    locale: ctx.locale,
  });

  cacheControl(ctx);

  return {
    props: {
      session,
      results,
      facets,
      totalResults,
      currentPage: page,
      query: ctx.query?.query ?? null,
      query_label: ctx.query?.query_label ?? null,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale, [
        'page-search',
        'common',
        'suggestions',
        'menus',
      ])),
    },
  };
}

export default function SearchPage(props: {
  results: ISearchResult[];
  totalResults: number;
  query: string;
  query_label: string;
  facets: any;
  currentPage: number;
}) {
  const MAPBOX_ACCESS_TOKEN = getPublicConfig('MAPBOX_ACCESS_TOKEN');
  const appConfig = useAppConfig();
  const { createResultsEvent } = useEventStore();
  const { t } = useTranslation('page-search');
  const [scroll] = useWindowScroll();
  const mapHidden = useMediaQuery('(max-width: 768px)');

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(scroll.y, 0), 80) - 80),
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

  const mapProps = useMemo(
    () => ({
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: mapStyle as Style,
      center: appConfig?.features?.map?.center,
      zoom: 12,
      animate: false,
      boundsPadding: 50,
    }),
    [appConfig?.features?.map?.center, MAPBOX_ACCESS_TOKEN],
  );

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:image" content={appConfig?.brand?.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={metaDescription} />
      </Head>

      <AppHeader fullWidth />

      <div className="relative flex h-full w-full gap-2">
        <FilterPanel filters={props.facets} />

        <div
          className="flex w-full flex-col overflow-y-auto md:max-w-xl"
          id="search-container"
        >
          <div className="bg-card p-2">
            <Search />
          </div>

          <Results
            results={props.results}
            noResults={props.results.length === 0}
            currentPage={props.currentPage}
            totalResults={props.totalResults}
            totalFilters={props.facets ? Object.keys(props.facets).length : 0}
          />
        </div>

        <div className="hidden w-full md:block">
          <div
            className="sticky top-2 mt-2 flex w-full pr-2"
            id="map-container"
            style={{
              height: `calc(100vh - ${clampedWindowValue}px - 16px)`,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-md">
              <MapboxMap {...mapProps}>
                <Markers results={props.results} />
              </MapboxMap>
            </div>
          </div>
        </div>
      </div>
      <AppFooter fullWidth />
    </>
  );
}
