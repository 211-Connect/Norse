'use client';
import Image from 'next/image';
import { useAppConfig } from '@/lib/context/app-config-context';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';

export function HeroSection() {
  const appConfig = useAppConfig();

  return (
    <div className="relative flex h-screen max-h-64 flex-col items-center justify-center gap-2 p-2 md:max-h-96">
      <Image
        fill
        src={appConfig?.hero?.url ?? ''}
        priority
        alt=""
        style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
      />

      <div
        className="flex min-w-full flex-col gap-2 rounded-md bg-white p-4 sm:min-w-[500px]"
        role="search"
      >
        <h3 className="text-xl font-bold">
          {appConfig?.search?.homePageTitle}
        </h3>

        <MainSearchLayout />
      </div>
    </div>
  );
}
