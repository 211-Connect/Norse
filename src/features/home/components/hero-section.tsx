'use client';
import Image from 'next/image';
import { useAppConfig } from '@/lib/context/app-config-context';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';

export function HeroSection() {
  const appConfig = useAppConfig();

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 p-2 py-8 sm:py-16 md:py-24">
      <Image
        fill
        src={appConfig?.hero?.url ?? '/hero.jpg'}
        priority
        alt=""
        style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
      />

      <div
        className="flex min-w-full flex-col gap-1 rounded-md bg-white p-4 sm:min-w-[500px]"
        role="search"
      >
        <h3 className="text-2xl font-bold">
          {appConfig?.search?.homePageTitle}
        </h3>

        <MainSearchLayout />
      </div>
    </div>
  );
}
