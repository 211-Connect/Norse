'use client';
import Image from 'next/image';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import { useTranslations } from 'next-intl';
import { useConfigStore } from '@/lib/context/config-context/config-store-provider';

export function HeroSection() {
  const config = useConfigStore((store) => store);
  const t = useTranslations('HomePage');

  return (
    <div className="relative flex h-screen max-h-64 flex-col items-center justify-center gap-2 p-2 md:max-h-96">
      {/* <Image
        fill
        src={config?.pages?.home?.heroSection?.backgroundImageUrl ?? ''}
        priority
        alt=""
        style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
      /> */}

      <div
        className="flex min-w-full flex-col gap-2 rounded-md bg-white p-4 sm:min-w-[500px]"
        role="search"
      >
        <h3 className="text-xl font-bold">{t('hero_title')}</h3>

        {/* <MainSearchLayout /> */}
      </div>
    </div>
  );
}
