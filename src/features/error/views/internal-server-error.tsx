import { buttonVariants } from '@/shared/components/ui/button';
import { Link } from '@/shared/components/link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

export function InternalServerError() {
  const { t } = useTranslation('page-500');
  const router = useRouter();

  return (
    <div className="flex flex-1">
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_description')} />
      </Head>

      <div className="relative flex flex-1 flex-col">
        <Image
          fill
          src={`${router.basePath}/undraw_500.svg`}
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
