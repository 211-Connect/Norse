import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies from 'nookies';
import { SearchAdapter } from '../../lib/adapters/SearchAdapter';
import { getServerSideAxios } from '../../lib/server/axios';
import { cacheControl } from '../../lib/server/cacheControl';
import { SearchView } from '@/features/search/views/search-view';
import { serverSideAppConfig } from '@/shared/lib/server-utils';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/shared/lib/constants';

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
    await searchAdapter.search(
      ctx.query,
      parseInt((ctx?.query?.page as string) ?? ''),
      {
        locale: ctx.locale,
      },
    );

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
      location: ctx.query?.location ?? null,
      distance: ctx.query?.distance ?? null,
      coords: ctx.query?.coords ?? null,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-search',
        'page-resource',
        'common',
        'dynamic',
        'suggestions',
      ])),
    },
  };
}

export default SearchView;
