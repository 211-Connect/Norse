import { useAppConfig } from '@/shared/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

export function TermsOfUseView() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('dynamic');

  const title = t('terms_of_use.title');
  const content = t('terms_of_use.content');

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={appConfig?.brand?.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={title} />
      </Head>

      <div className="container mx-auto pb-8 pt-8">
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </>
  );
}
