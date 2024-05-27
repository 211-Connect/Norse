import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPropsContext } from 'next';
import { AppHeader } from '../components/app-header';
import { AppFooter } from '../components/app-footer';
import { DataProviders } from '../components/app-footer/components/data-providers';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { serverSideAppConfig } from '@/lib/server/utils';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx?.locale ?? 'en')),
    },
  };
}

export default function NotFoundError() {
  const { t } = useTranslation('page-404');

  const metaTitle = t('meta_title');
  const metaDescription = t('meta_description');

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <div className="flex flex-1 flex-col relative items-center justify-center">
          <Image
            fill
            src="/undraw_404.svg"
            alt=""
            className="object-contain z-0 object-center"
            priority
          />

          <div className="flex flex-col z-10 items-center gap-2 text-center text-foreground justify-center bg-card shadow-md max-w-xl mx-auto p-4 rounded-md">
            <h3 className="font-bold text-3xl">{t('title')}</h3>

            <h4 className="font-semibold">{t('description')}</h4>

            <Link className={cn(buttonVariants({ variant: 'link' }))} href="/">
              {t('back_to_home')}
            </Link>
          </div>
        </div>
        <AppFooter>
          <DataProviders />
        </AppFooter>
      </div>
    </>
  );
}
