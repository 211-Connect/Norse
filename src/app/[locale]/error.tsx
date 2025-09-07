'use client';

import { InternalServerErrorContent } from '@/app/features/error/components/internal-server-error-content';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { getCookies } from 'cookies-next/client';

export default function InternalServerError() {
  const appConfig = useAppConfig();
  const cookies = getCookies();

  if (!appConfig?.errorTranslationData) {
    return null;
  }

  const {
    errorNamespaces: i18nNamespaces,
    resources,
    locale,
  } = appConfig.errorTranslationData;

  return (
    <PageWrapper
      cookies={cookies}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <InternalServerErrorContent />
    </PageWrapper>
  );
}
