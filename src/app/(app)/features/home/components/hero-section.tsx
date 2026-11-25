'use client';

import { type StepType, useTour } from '@reactour/tour';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Image } from '@/app/(app)/shared/components/image';
import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';

import { heroImageSrc } from '../utils/hero-image';

type TourPositionPreference = 'above' | 'below';

export function HeroSection() {
  const appConfig = useAppConfig();
  // The tenant's v2 switch: off keeps the v1 hero.
  const v2 = appConfig.featureFlags.enableV2Api;
  const heroSrc = heroImageSrc(appConfig.heroUrl);
  const { setCurrentStep, setIsOpen, setSteps } = useTour();
  const { t } = useTranslation('page-home');
  const showHomePageTour = useFlag('showHomePageTour');
  const homeSearchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const takeTourLabel =
    t('take_a_tour', {
      defaultValue: 'First time here? Take a tour!',
    }).trim() || 'First time here? Take a tour!';

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
    <div
      className={cn(
        'relative flex h-screen flex-col items-center justify-center gap-2 p-2',
        v2 ? 'max-h-80 md:max-h-[28rem]' : 'max-h-64 md:max-h-96',
      )}
    >
      {v2 && !heroSrc ? (
        // No tenant photo: a plain gradient instead.
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#a9d3dc] via-[#8fb3bd] to-[#20433f]" />
      ) : (
        <Image
          fill
          src={v2 ? (heroSrc ?? '') : (appConfig.heroUrl ?? '')}
          priority
          alt=""
          style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
        />
      )}

      <div
        className={cn(
          'bg-primary flex w-full flex-col rounded-lg shadow-xl ring-1 shadow-black/20 ring-white/10',
          v2
            ? 'max-w-[38rem] gap-3 p-5'
            : 'animate-in fade-in slide-in-from-bottom-2 max-w-[31rem] gap-2 p-3 duration-500 ease-out sm:p-4',
        )}
        role="search"
      >
        <h2
          className={cn(
            'font-semibold text-white',
            v2 ? 'text-3xl md:text-4xl' : 'text-2xl tracking-tight',
          )}
        >
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
          aria-label={takeTourLabel}
          aria-controls="home-page-tour-dialog"
          aria-haspopup="dialog"
          data-home-tour-trigger="true"
          className="border-foreground/40 bg-background text-foreground hover:bg-primary hover:text-primary-foreground focus-visible:border-foreground focus-visible:ring-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-offset-4"
        >
          {takeTourLabel}
        </Button>
      )}
    </div>
  );
}
