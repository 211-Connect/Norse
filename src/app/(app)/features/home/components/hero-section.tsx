'use client';

import { useTour, type StepType } from '@reactour/tour';
import { useCallback, useRef } from 'react';
import { createTourEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { useTranslation } from 'react-i18next';
import { Image } from '@/app/(app)/shared/components/image';

export function HeroSection() {
  const appConfig = useAppConfig();
  const { isOpen, setCurrentStep, setIsOpen, setSteps } = useTour();
  const { t } = useTranslation('page-home');
  const showHomePageTour = useFlag('showHomePageTour');
  const homeSearchTriggerRef = useRef<HTMLButtonElement | null>(null);

  const getStepOnePosition = useCallback<
    Extract<NonNullable<StepType['position']>, (...args: never[]) => unknown>
  >(
    ({ windowHeight, windowWidth, top, bottom, left, right, width, height }) => {
      if (windowWidth < 768) {
        return 'center';
      }

      const popoverWidth = width || Math.min(576, windowWidth - 32);
      const popoverHeight = height || 0;
      const targetWidth = right - left;
      const targetCenterX = left + targetWidth / 2;
      const minInset = 16;
      const x = Math.min(
        Math.max(targetCenterX - popoverWidth / 2, minInset),
        windowWidth - popoverWidth - minInset,
      );
      const spaceBelow = windowHeight - bottom;
      const spaceAbove = top;
      const y =
        spaceBelow >= 360 || spaceBelow >= spaceAbove
          ? bottom + 24
          : Math.max(top - popoverHeight - 24, minInset);

      return [x, y];
    },
    [],
  );

  const buildTourSteps = useCallback((): StepType[] => {
    const searchTarget = homeSearchTriggerRef.current;

    return [
      {
        selector: searchTarget ?? '.search-box',
        position: getStepOnePosition,
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
        position: 'center',
        content: (
          <div className="flex flex-col gap-2">
            <p>{t('tour.step_2.paragraph_1')}</p>
            <p>{t('tour.step_2.paragraph_2')}</p>
          </div>
        ),
      },
    ];
  }, [getStepOnePosition, t]);

  const enableTour = () => {
    createTourEvent(null);
    const tourSteps = buildTourSteps();

    if (setSteps) {
      setSteps(tourSteps);
    }

    if (setCurrentStep) {
      setCurrentStep(0);
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
        className="flex w-full max-w-[31rem] flex-col gap-2 rounded-lg bg-primary p-3"
        role="search"
      >
        <h2 className="text-2xl font-medium text-white">
          {appConfig.search.texts?.title ||
            t('search.hero_title', { ns: 'common' })}
        </h2>

        <MainSearchLayout
          addMyLocationButtonVariant="link"
          searchTriggerRef={homeSearchTriggerRef}
        />
      </div>

      {showHomePageTour && (
        <Button
          onClick={enableTour}
          variant="outline"
          aria-controls="home-page-tour-dialog"
          aria-expanded={isOpen ?? false}
          aria-haspopup="dialog"
          data-home-tour-trigger="true"
          className="border-foreground/40 bg-background/95 text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
        >
          {t('take_a_tour')}
        </Button>
      )}
    </div>
  );
}
