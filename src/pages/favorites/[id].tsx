import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAppConfig } from '@/hooks/use-app-config';
import { PluginLoader } from '../../components/plugin-loader';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useEffect } from 'react';
import { FavoritesSection } from '@/components/favorite-lists/components/favorites';
import useWindowScroll from '@/hooks/use-window-scroll';
import useMediaQuery from '@/hooks/use-media-query';
import { serverSideAppConfig } from '@/lib/server/utils';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  return {
    props: {
      session,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-list',
        'common',
      ])),
    },
  };
}

export default function FavoritesDetail() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-list');
  const [scroll] = useWindowScroll();
  const mapHidden = useMediaQuery('(max-width: 768px)');

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(scroll.y, 0), 80) - 80)
  );

  useEffect(() => {
    if (mapHidden) return;
    window.dispatchEvent(new Event('resize'));
  }, [clampedWindowValue, mapHidden]);

  const metaTitle = t('meta_title');
  const metaDescription = t('meta_title');

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
      <div className="flex flex-col">
        <AppHeader fullWidth />

        <div className="flex">
          <div
            className="flex flex-col gap-2 md:max-w-xl w-full overflow-y-auto"
            id="search-container"
          >
            <FavoritesSection />
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
                  // locations={favoriteList.favorites.map((el: any) => ({
                  //   id: el._id,
                  //   name: el.displayName,
                  //   description: el?.translations?.[0]?.serviceDescription,
                  //   location: el.location,
                  //   website: el.website,
                  //   phone: el?.phoneNumbers?.find(
                  //     (el: any) => el.rank === 1 && el.type === 'voice'
                  //   ),
                  // }))}
                />
              </div>
            </div>
          </div>
        </div>

        <AppFooter fullWidth />
      </div>
    </>
  );
}
