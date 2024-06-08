import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { authOptions } from '../api/auth/[...nextauth]';
import { useTranslation } from 'next-i18next';
import { FavoriteLists } from '@/components/favorite-lists';
import { serverSideAppConfig } from '@/lib/server-utils';
import MapLoader from '@/components/map';

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
        'menus',
      ])),
    },
  };
}

export default function Lists() {
  const { t } = useTranslation('page-favorites');

  const metaTitle = t('meta_title');
  const metaDescription = t('meta_description');

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <div className="flex h-screen flex-col overflow-hidden">
        <AppHeader fullWidth />

        <div className="flex h-full w-full flex-1 overflow-hidden">
          <div
            className="flex w-full flex-col overflow-y-auto overscroll-none md:max-w-[550px]"
            id="search-container"
          >
            <FavoriteLists />
          </div>

          <div
            className="relative hidden h-full w-full md:flex"
            id="map-container"
          >
            <div className="absolute bottom-0 left-0 right-0 top-0 z-10 flex items-center justify-center bg-black bg-opacity-60">
              <p className="text-xl text-white">{t('select_a_list')}</p>
            </div>

            <div className="flex h-full w-full">
              <MapLoader results={[]} />
            </div>
          </div>
        </div>
        <AppFooter fullWidth />
      </div>
    </>
  );
}
