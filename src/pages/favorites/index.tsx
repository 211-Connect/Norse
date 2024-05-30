import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAppConfig } from '@/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import { FavoriteLists } from '@/components/favorite-lists';
import { serverSideAppConfig } from '@/lib/server/utils';
import MapboxMap from '@/components/map';
import mapStyle from '@/components/map/style.json';
import { Style } from 'mapbox-gl';
import { NEXT_PUBLIC_MAPBOX_API_KEY } from '@/constants/env';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session || session.error) {
    return {
      redirect: {
        destination: `/${ctx.locale}/auth/signin?redirect=${encodeURIComponent(
          '/favorites',
        )}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-favorites',
        'common',
      ])),
    },
  };
}

export default function Lists() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-favorites');

  const metaTitle = t('meta_title');
  const metaDescription = t('meta_description');

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader fullWidth />

        <div className="flex w-full h-full overflow-hidden flex-1">
          <div
            className="flex flex-col w-full overflow-y-auto md:max-w-[550px] overscroll-none"
            id="search-container"
          >
            <FavoriteLists />
          </div>

          <div
            className="w-full h-full relative hidden md:flex"
            id="map-container"
          >
            <div className="flex justify-center items-center absolute top-0 right-0 bottom-0 left-0 z-10 bg-black bg-opacity-60">
              <p className="text-xl text-white">{t('select_a_list')}</p>
            </div>

            <div className="flex w-full h-full">
              <MapboxMap
                accessToken={NEXT_PUBLIC_MAPBOX_API_KEY}
                style={mapStyle as Style}
                center={appConfig?.features?.map?.center}
                zoom={12}
                animate={false}
                boundsPadding={50}
              />
            </div>
          </div>
        </div>
        <AppFooter fullWidth />
      </div>
    </>
  );
}
