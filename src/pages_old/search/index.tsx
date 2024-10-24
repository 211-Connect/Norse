import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies from 'nookies';
import { SearchView } from '@/features/search/views/search-view';
import {
  cacheControl,
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/shared/lib/constants';
import { SearchService } from '@/shared/services/search-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { getServerDevice } from '@/shared/lib/get-server-device';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = nookies.get(ctx);
  const appConfig = (await serverSideAppConfig()).appConfig;
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const device = getServerDevice(ctx.req.headers['user-agent']);

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

  const limit = appConfig.search.resultsLimit;
  const { results, noResults, totalResults, page, filters } =
    await SearchService.findResources(ctx.query, {
      locale: ctx.locale,
      page: parseInt((ctx?.query?.page as string) ?? ''),
      limit,
    });

  cacheControl(ctx);

  return {
    props: {
      device,
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
      appConfig: appConfig,
      session,
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-search',
        'page-resource',
        'common',
        'dynamic',
        'categories',
        'suggestions',
      ])),
    },
  };
}

export default SearchView;
