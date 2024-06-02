import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies, { destroyCookie, setCookie } from 'nookies';
import { memo, useEffect, useMemo } from 'react';
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
import qs from 'qs';
import MapboxMap, { Marker } from '@/components/map';
import mapStyle from '@/components/map/style.json';
import { Style } from 'mapbox-gl';
import { IconPhone, IconWorldWww } from '@tabler/icons-react';
import { ReferralButton } from '@/components/referral-button';
import { parseHtml } from '@/lib/parseHtml';
import { getPublicConfig } from '../api/config';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { getSearchAdapter } from '@/lib/adapters/search/get-search-adapter';
import { QueryConfig } from '@/lib/adapters/search/BaseSearchAdapter';

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

    return {
      redirect: {
        destination: `${prefix}/search${cookies[USER_PREF_LAST_QUERY] || ''}`,
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
    setCookie(ctx, USER_PREF_LAST_QUERY, `?${qs.stringify(ctx.query)}`, {
      path: '/',
    });
  } else {
    destroyCookie(ctx, USER_PREF_LAST_QUERY, { path: '/' });
  }

  const url = ctx.resolvedUrl.split('?')[1];
  const searchAdapter = await getSearchAdapter();
  const { results, noResults, totalResults, page, facets } =
    await searchAdapter.search({
      ...(qs.parse(url) as QueryConfig),
      locale: ctx.locale,
    });

  cacheControl(ctx);

  return {
    props: {
      session,
      results,
      noResults,
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

// Memoized markers to prevent re-renders of map component
const Markers = memo(function MemoizedMarkers({ results }: { results: any }) {
  const { t } = useTranslation();

  return (
    <>
      {results.map((result) => {
        if (result?.location?.coordinates == null) return null;

        return (
          <Marker
            key={result.id}
            latitude={result.location.coordinates[1]}
            longitude={result.location.coordinates[0]}
            className="custom-marker"
            onClick={(e, marker) => {
              e.preventDefault();
              e.stopPropagation();
              const element = document.getElementById(result._id);

              document
                .querySelectorAll('.outline')
                .forEach((elem) => elem.classList.remove('outline'));

              if (element) {
                element.classList.add('outline');
                element.scrollIntoView();
              }

              marker.togglePopup();
            }}
            popup={
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{result.name}</h3>
                <div className="whitespace-pre-wrap text-sm">
                  {parseHtml(result?.description ?? '')}
                </div>

                <div className="flex gap-2">
                  <ReferralButton
                    referralType="call_referral"
                    resourceId={result._id}
                    resource={result}
                    disabled={!result.phone}
                    href={`tel:${result.phone}`}
                    className="min-w-[130px] gap-1 w-full"
                  >
                    <IconPhone className="size-4" />
                    {t('call_to_action.call', {
                      ns: 'common',
                    })}
                  </ReferralButton>

                  <ReferralButton
                    referralType="website_referral"
                    resourceId={result._id}
                    resource={result}
                    disabled={!result.website}
                    href={result?.website ?? ''}
                    target="_blank"
                    className="min-w-[130px] gap-1 w-full"
                  >
                    <IconWorldWww className="size-4" />
                    {t('call_to_action.view_website', {
                      ns: 'common',
                    })}
                  </ReferralButton>
                </div>
              </div>
            }
          />
        );
      })}
    </>
  );
});

export default function SearchPage(props: any) {
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

      <div className="w-full h-full flex relative gap-2">
        <FilterPanel filters={props.facets} />

        <div
          className="flex flex-col md:max-w-xl w-full overflow-y-auto"
          id="search-container"
        >
          <div className="p-2 bg-card">
            <Search />
          </div>

          <Results
            results={props.results}
            noResults={props.noResults}
            currentPage={props.currentPage}
            totalResults={props.totalResults}
            totalFilters={props.facets ? Object.keys(props.facets).length : 0}
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
