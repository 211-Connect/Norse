'use client';

import Image from 'next/image';
import { useTour } from '@reactour/tour';
import { useMemo } from 'react';
import { createTourEvent } from '@/app/shared/lib/google-tag-manager';
import { Button } from '@/app/shared/components/ui/button';
import { MainSearchLayout } from '@/app/shared/components/search/main-search-layout';
import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { useFlag } from '@/app/shared/hooks/use-flag';
import { useTranslation } from 'react-i18next';

export function HeroSection() {
  const appConfig = useAppConfig();
  const { setIsOpen, setSteps } = useTour();
  const { t } = useTranslation('page-home');
  const showHomePageTour = useFlag('showHomePageTour');

  const tourSteps = useMemo(() => {
    const steps = [
      {
        selector: '.search-box',
        content: (
          <div className="flex flex-col gap-2">
            <p>{t('tour.step_1.paragraph_1')}</p>
            <p>{t('tour.step_1.paragraph_2')}</p>
            <p>{t('tour.step_1.paragraph_3')}</p>
          </div>
        ),
      },
      {
        selector: '.categories',
        content: (
          <div className="flex flex-col gap-2">
            <p>{t('tour.step_2.paragraph_1')}</p>
            <p>{t('tour.step_2.paragraph_2')}</p>
          </div>
        ),
      },
    ];

    return steps;
  }, [t]);

  const enableTour = () => {
    createTourEvent(null);

    if (setSteps) {
      setSteps(tourSteps);
    }

    setIsOpen(true);
  };

  return (
    <div className="relative flex h-screen max-h-64 flex-col items-center justify-center gap-2 p-2 md:max-h-96">
      <Image
        fill
        src={appConfig?.pages?.home?.heroSection?.backgroundImageUrl ?? ''}
        priority
        alt=""
        style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
      />

      <div
        className="flex min-w-full flex-col gap-2 rounded-lg bg-[#0E2853] p-3 sm:min-w-[500px]"
        role="search"
      >
        <h3 className="text-2xl font-medium text-white">
          {t('search.hero_title', {
            ns: 'dynamic',
            defaultValue: t('search.hero_title', { ns: 'common' }),
          })}
        </h3>

        <MainSearchLayout />
      </div>

      {showHomePageTour && (
        <Button
          onClick={enableTour}
          variant="outline"
          className="hover:bg-primary/70 hover:text-primary-foreground"
        >
          {t('take_a_tour')}
        </Button>
      )}
    </div>
  );
}
