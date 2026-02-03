import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { Metadata } from 'next/types';
import { getResource } from '@/app/(app)/shared/services/resource-service';
import { FetchError } from '@/app/(app)/shared/lib/fetchError';
import { permanentRedirect, notFound, RedirectType } from 'next/navigation';
import { ResourcePageContent } from '@/app/(app)/features/resource/components/content';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { isValidUUID } from '@/app/(app)/shared/utils/uuid';
import { Resource } from '@/types/resource';

const i18nNamespaces = ['page-resource', 'common'];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { id, locale } = await params;

  const appConfig = await getAppConfigWithoutHost(locale);

  let resource: Resource | null = null;

  if (id && isValidUUID(id)) {
    try {
      resource = await getResource(id, locale, appConfig.tenantId);
    } catch {}
  }

  if (!resource) {
    return {};
  }

  return {
    openGraph: {
      description: resource.description ?? undefined,
      images: appConfig.brand.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title: resource.name ?? undefined,
    },
    description: resource.description ?? undefined,
    title: resource.name ?? undefined,
  };
};

export default async function ResourcePage({ params }) {
  const { id, locale } = await params;

  if (!id || !isValidUUID(id)) {
    console.warn('Resource ID is not a valid UUID:', id);
    notFound();
  }

  const [cookieList, appConfig] = await Promise.all([
    getCookies({ cookies }),
    getAppConfigWithoutHost(locale),
  ]);

  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  let resource: Resource | null = null;

  try {
    resource = await getResource(id, locale, appConfig.tenantId);
  } catch (err) {
    if (
      err instanceof FetchError &&
      err.response.status === 404 &&
      err.response.data?.redirect
    ) {
      permanentRedirect(
        `/${locale}${err.response.data.redirect}`,
        RedirectType.replace,
      );
    }
  }

  if (!resource) {
    notFound();
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <ResourcePageContent resource={resource} />
    </PageWrapper>
  );
}
