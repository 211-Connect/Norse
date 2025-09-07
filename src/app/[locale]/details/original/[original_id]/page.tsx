import { Metadata } from 'next/types';
import initTranslations from '@/app/shared/i18n/i18n';
import { getResourceByOriginalId } from '@/app/shared/services/resource-service';
import { isAxiosError } from 'axios';
import { notFound, permanentRedirect, RedirectType } from 'next/navigation';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { ResourcePageContent } from '@/app/features/resource/components/content';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';

const i18nNamespaces = ['page-resource', 'page-404', 'common', 'dynamic'];

export const generateMetadata = async ({ params }) => {
  const { original_id, locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  let notFoundFlag = false;

  if (original_id) {
    try {
      await getResourceByOriginalId(original_id, locale);
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
  const { resources } = await initTranslations(locale, i18nNamespaces);

  let notFoundFlag = false;
  let resource: any = null;

  if (original_id) {
    try {
      resource = await getResourceByOriginalId(original_id, locale);
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

  if (notFound) {
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
