import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAppConfig } from '@/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useEffect } from 'react';
import { FavoritesSection } from '@/components/favorite-lists/components/favorites';
import useWindowScroll from '@/hooks/use-window-scroll';
import useMediaQuery from '@/hooks/use-media-query';
import { serverSideAppConfig } from '@/lib/server-utils';
import { useAtomValue } from 'jotai';
import { favoriteListWithFavoritesAtom } from '@/components/favorite-lists/components/favorites/state';
import MapLoader from '@/components/map';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  return {
    props: {
      session,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-list',
        'common',
        'menus',
      ])),
    },
  };
}

export default function FavoritesDetail() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-list');
  const [scroll] = useWindowScroll();
  const mapHidden = useMediaQuery('(max-width: 768px)');
  const { data } = useAtomValue(favoriteListWithFavoritesAtom);

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(scroll.y, 0), 80) - 80),
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
            className="flex w-full flex-col gap-2 overflow-y-auto md:max-w-xl"
            id="search-container"
          >
            <FavoritesSection />
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
                <MapLoader
                  zoom={12}
                  animate={false}
                  boundsPadding={50}
                  boundsZoom={
                    (data?.favorites?.length ?? 0) > 1 ? undefined : 13
                  }
                  results={data?.favorites
                    ?.map((list) => {
                      if (list?.location?.coordinates == null) return null;
                      return {
                        id: list._id,
                        location: {
                          point: {
                            type: list.location.type,
                            coordinates: list.location.coordinates,
                          },
                        },
                      };
                    })
                    .filter((el) => el != null)}
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
