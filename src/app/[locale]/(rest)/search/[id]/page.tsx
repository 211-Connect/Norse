import initTranslations from '@/app/shared/i18n/i18n';
import { Metadata } from 'next/types';
import { getAppConfig } from '@/app/shared/lib/appConfig';
import { getResource } from '@/app/shared/services/resource-service';
import { isAxiosError } from 'axios';
import { permanentRedirect, redirect, RedirectType } from 'next/navigation';
import { ResourcePageContent } from '@/app/features/resource/components/content';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';

const i18nNamespaces = [
  'page-resource',
  'common',
  'dynamic',
  'categories',
  'suggestions',
];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const appConfig = getAppConfig();

  const { id, locale } = await params;
  let resource: any = null;

  if (id) {
    try {
      resource = await getResource(id, locale);
    } catch {}
  }

  if (!resource) {
    return {};
  }

  return {
    openGraph: {
      description: resource.description,
      images: appConfig?.brand?.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title: resource.name,
    },
    description: resource.description,
    title: resource.name,
  };
};

export default async function ResourcePage({ params }) {
  const { id, locale } = await params;
  const cookieList = await getCookies({ cookies });
  const { resources } = await initTranslations(locale, i18nNamespaces);

  let resource: any = null;

  if (id) {
    try {
      resource = await getResource(id, locale);
    } catch (err) {
      if (isAxiosError(err)) {
        if (err?.response?.status === 404) {
          if (err.response.data.redirect) {
            permanentRedirect(
              `/${locale}${err.response.data.redirect}`,
              RedirectType.replace,
            );
          }

          redirect(`/${locale}`, RedirectType.replace);
        }
      } else {
        console.error(err);
      }
    }
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
