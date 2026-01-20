import { Metadata } from 'next/types';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getResourceByOriginalId } from '@/app/(app)/shared/services/resource-service';
import { isAxiosError } from 'axios';
import { notFound, permanentRedirect, RedirectType } from 'next/navigation';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { ResourcePageContent } from '@/app/(app)/features/resource/components/content';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { Resource } from '@/types/resource';

const i18nNamespaces = ['page-resource', 'page-404', 'common'];

export const generateMetadata = async ({ params }) => {
  const { original_id, locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  let notFoundFlag = false;

  if (original_id) {
    try {
      await getResourceByOriginalId(original_id, locale, appConfig.tenantId);
    } catch (err) {
      if (isAxiosError(err)) {
        if (err?.response?.status === 404) {
          notFoundFlag = true;
        }
      } else {
        console.error(err);
      }
    }
  }

  const metadata: Metadata = {
    robots: {
      index: false,
    },
  };

  if (notFoundFlag) {
    metadata.description = t('meta_description', { ns: 'page-404' });
    metadata.title = t('meta_title', { ns: 'page-404' });
  }

  return metadata;
};

export default async function OriginalDetailsPage({ params }) {
  const cookieList = await getCookies({ cookies });
  const { original_id, locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  let notFoundFlag = false;
  let resource: Resource | null = null;

  if (original_id) {
    try {
      resource = await getResourceByOriginalId(
        original_id,
        locale,
        appConfig.tenantId,
      );
    } catch (err) {
      if (isAxiosError(err)) {
        if (err?.response?.status === 404) {
          notFoundFlag = true;

          if (err.response.data.redirect) {
            permanentRedirect(
              `/${locale}${err.response.data.redirect}`,
              RedirectType.replace,
            );
          }
        }
      } else {
        console.error(err);
      }
    }
  }

  if (notFoundFlag || !resource) {
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
