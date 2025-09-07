import { cookies, headers } from 'next/headers';
import initTranslations from '@/app/shared/i18n/i18n';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import Image from 'next/image';
import { buttonVariants } from '@/app/shared/components/ui/button';
import { LocalizedLink } from '@/app/shared/components/LocalizedLink';
import { getCookies } from 'cookies-next/server';

const i18nNamespaces = ['common', 'page-404', 'dynamic'];

export const generateMetadata = async ({ params }) => {
  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  return {
    description: t('meta_description', { ns: 'page-404' }),
    title: t('meta_title', { ns: 'page-404' }),
  };
};

export default async function NotFoundPage() {
  const headerList = await headers();
  const cookieList = await getCookies({ cookies });

  const locale = headerList.get('x-next-i18n-router-locale') || 'en';
  const { t, resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <div className="relative flex flex-1 flex-col">
        <Image
          fill
          src="/images/undraw_404.svg"
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
