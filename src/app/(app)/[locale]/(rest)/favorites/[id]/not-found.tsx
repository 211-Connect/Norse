import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';

import { FavoriteListUnavailable } from '@/app/(app)/features/favorites/components/favorite-list-unavailable';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';

const i18nNamespaces = ['common', 'page-list'];

/**
 * Rendered (with a 404 status) when `page.tsx` calls `notFound()` because the
 * list is private to someone else or no longer exists.
 */
export default async function FavoriteListNotFound() {
  const headersList = await headers();
  const cookieList = await getCookies({ cookies });
  const nonce = headersList.get('x-nonce') ?? '';
  const locale = headersList.get('x-next-i18n-router-locale') || 'en';

  const [appConfig, session] = await Promise.all([
    getAppConfigWithoutHost(locale),
    getSession(),
  ]);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <FavoriteListUnavailable
        isSignedIn={Boolean(session && !session.error)}
      />
    </PageWrapper>
  );
}
