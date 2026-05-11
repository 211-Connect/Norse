'use client';

import { InternalServerErrorContent } from '@/app/(app)/features/error/components/internal-server-error-content';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { getErrorTranslationData } from '@/app/(app)/shared/serverActions/i18n/getErrorTranslationData';
import { defaultLocale } from '@/payload/i18n/locales';
import { useQuery } from '@tanstack/react-query';
import { getCookies } from 'cookies-next/client';
import { useParams } from 'next/navigation';

export default function InternalServerError() {
  const params = useParams<{ locale?: string }>();
  const cookies = getCookies();
  const locale = params?.locale ?? defaultLocale;

  const { data: translationData } = useQuery({
    queryKey: ['errorTranslationData', locale],
    queryFn: () => getErrorTranslationData(locale),
  });

  if (!translationData) {
    return null;
  }

  return (
    <PageWrapper
      cookies={cookies}
      translationData={{
        i18nNamespaces: translationData.i18nNamespaces,
        locale: translationData.locale,
        resources: translationData.resources,
      }}
    >
      <InternalServerErrorContent />
    </PageWrapper>
  );
}
