'use client';

import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { Link } from '@/app/(app)/shared/components/link';
import Head from 'next/head';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export function InternalServerErrorContent() {
  const { t, i18n } = useTranslation('page-500');

  return (
    <div className="flex flex-1">
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_description')} />
      </Head>

      <div className="relative flex flex-1 flex-col">
        <Image
          fill
          src="/images/undraw_500.svg"
          alt="Illustration of an internal server error"
          style={{ objectFit: 'contain', zIndex: -1, objectPosition: 'center' }}
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black/60 text-white">
          <h1 className="text-4xl font-bold">{t('title')}</h1>

          <p className="text-lg font-semibold">{t('description')}</p>

          <Link className={buttonVariants({ variant: 'default' })} href="/">
            {t('back_to_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
