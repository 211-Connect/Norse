'use client';

import { useTour } from '@reactour/tour';
import { useMemo } from 'react';
import { createTourEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { useTranslation } from 'react-i18next';
import { Image } from '@/app/(app)/shared/components/image';

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
        src={appConfig.heroUrl ?? ''}
        priority
        alt=""
        style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
      />

      <div
        className="flex min-w-full flex-col gap-2 rounded-lg bg-primary p-3 sm:min-w-[500px]"
        role="search"
      >
        <h2 className="text-2xl font-medium text-white">
          {appConfig.search.texts?.title ||
            t('search.hero_title', { ns: 'common' })}
        </h2>

        <MainSearchLayout addMyLocationButtonVariant="link" />
      </div>

      {showHomePageTour && (
        <Button
          onClick={enableTour}
          variant="outline"
          className="hover:bg-primary hover:text-primary-foreground"
        >
          {t('take_a_tour')}
        </Button>
      )}
    </div>
  );
}
