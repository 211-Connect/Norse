import { cookies, headers } from 'next/headers';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import Image from 'next/image';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';
import { getCookies } from 'cookies-next/server';
import { getAppConfigWithoutHost } from '../../shared/utils/appConfig';
import { getImageUrl } from '../../shared/utils/getImageUrl';

const i18nNamespaces = ['common', 'page-404'];

export const generateMetadata = async ({ params }) => {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return {
    description: t('meta_description', { ns: 'page-404' }),
    title: t('meta_title', { ns: 'page-404' }),
  };
};

export default async function NotFoundPage() {
  const headerList = await headers();
  const cookieList = await getCookies({ cookies });

  const locale = headerList.get('x-next-i18n-router-locale') || 'en';

  const appConfig = await getAppConfigWithoutHost(locale);
  const { t, resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <div className="relative flex flex-1 flex-col">
        <Image
          fill
          src={getImageUrl('undraw_404.svg')}
          alt="404 illustration"
          style={{ objectFit: 'contain', zIndex: -1, objectPosition: 'center' }}
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black/60 text-white">
          <h1 className="text-4xl font-bold">
            {t('title', { ns: 'page-404' })}
          </h1>

          <p className="text-center text-lg font-semibold">
            {t('description', { ns: 'page-404' })}
          </p>

          <LocalizedLink
            className={buttonVariants({ variant: 'default' })}
            href="/"
          >
            {t('back_to_home', { ns: 'page-404' })}
          </LocalizedLink>
        </div>
      </div>
    </PageWrapper>
  );
}
