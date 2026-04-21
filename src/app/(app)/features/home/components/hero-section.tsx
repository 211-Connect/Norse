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

type TourPositionPreference = 'above' | 'below';

export function HeroSection() {
  const appConfig = useAppConfig();
  const { isOpen, setCurrentStep, setIsOpen, setSteps } = useTour();
  const { t } = useTranslation('page-home');
  const showHomePageTour = useFlag('showHomePageTour');
  const homeSearchTriggerRef = useRef<HTMLButtonElement | null>(null);

  const getResponsiveTourPosition = useCallback(
    (
      {
        windowHeight,
        windowWidth,
        top,
        bottom,
        left,
        right,
        width,
        height,
      }: {
        windowHeight: number;
        windowWidth: number;
        top: number;
        bottom: number;
        left: number;
        right: number;
        width: number;
        height: number;
      },
      preferredDirection: TourPositionPreference,
    ): 'center' | [number, number] => {
      const minInset = 16;
      const gap = 24;

      if (windowWidth < 768) {
        return 'center';
      }

      const popoverWidth = width || Math.min(576, windowWidth - minInset * 2);
      const popoverHeight =
        height || Math.min(windowHeight - minInset * 2, 24 * 18);
      const targetWidth = right - left;
      const targetCenterX = left + targetWidth / 2;
      const x = Math.min(
        Math.max(targetCenterX - popoverWidth / 2, minInset),
        windowWidth - popoverWidth - minInset,
      );
      const spaceBelow = windowHeight - bottom - gap - minInset;
      const spaceAbove = top - gap - minInset;

      if (
        windowHeight < 720 ||
        (spaceBelow < popoverHeight && spaceAbove < popoverHeight)
      ) {
        return 'center';
      }

      const preferredY =
        preferredDirection === 'below'
          ? bottom + gap
          : Math.max(top - popoverHeight - gap, minInset);
      const fallbackY =
        preferredDirection === 'below'
          ? Math.max(top - popoverHeight - gap, minInset)
          : bottom + gap;
      const canUsePreferred =
        preferredDirection === 'below'
          ? spaceBelow >= popoverHeight
          : spaceAbove >= popoverHeight;
      const y =
        canUsePreferred ||
        (preferredDirection === 'below'
          ? spaceBelow >= spaceAbove
          : spaceAbove >= spaceBelow)
          ? preferredY
          : fallbackY;

      return [x, y];
    },
    [],
  );

  const getStepOnePosition = useCallback<
    Extract<NonNullable<StepType['position']>, (...args: never[]) => unknown>
  >(
    (positionProps) => getResponsiveTourPosition(positionProps, 'below'),
    [getResponsiveTourPosition],
  );

  const getStepTwoPosition = useCallback<
    Extract<NonNullable<StepType['position']>, (...args: never[]) => unknown>
  >(
    (positionProps) =>
      getResponsiveTourPosition(
        {
          ...positionProps,
          top: positionProps.top + positionProps.height * 0.15,
          bottom: positionProps.bottom - positionProps.height * 0.65,
        },
        'above',
      ),
    [getResponsiveTourPosition],
  );

  const buildTourSteps = useCallback((): StepType[] => {
    const searchTarget = homeSearchTriggerRef.current;

    return [
      {
        selector: searchTarget ?? '.search-box',
        position: getStepOnePosition,
        resizeObservables: ['.search-box', '.categories'],
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
        position: getStepTwoPosition,
        resizeObservables: ['.categories'],
        content: (
          <div className="flex flex-col gap-2">
            <p>{t('tour.step_2.paragraph_1')}</p>
            <p>{t('tour.step_2.paragraph_2')}</p>
          </div>
        ),
      },
    ];
  }, [getStepOnePosition, getStepTwoPosition, t]);

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
