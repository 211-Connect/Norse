import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useEventStore } from '../lib/hooks/useEventStore';
import { useTour } from '@reactour/tour';
import { useMemo } from 'react';
import { HomePageSearch } from './home-page-search';
import { useAppConfig } from '../lib/hooks/useAppConfig';
import { Button } from './ui/button';

export function HeroSection() {
  const appConfig = useAppConfig();
  const { setIsOpen, setSteps } = useTour();
  const { createTourEvent } = useEventStore();
  const { t } = useTranslation('page-home');

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

    if (appConfig.contact.feedbackUrl) {
      steps.push({
        selector: '.feedback',
        content: (
          <div className="flex flex-col gap-2">
            <p>{t('tour.step_3.paragraph_1')}</p>
            <p>{t('tour.step_3.paragraph_2')}</p>
          </div>
        ),
      });
    }

    return steps;
  }, [appConfig.contact.feedbackUrl, t]);

  const enableTour = () => {
    createTourEvent(null);

    if (setSteps) {
      setSteps(tourSteps);
    }

    setIsOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 items-center relative justify-center h-screen pl-2 pr-2 max-h-[250px] md:max-h-[450px] md:pl-0 md:pr-0">
      <Image
        fill
        src={appConfig.pages.home.heroSection.backgroundImageUrl}
        priority
        alt=""
        className="object-cover z-0 object-center"
      />

      <div className="w-full max-w-[460px] bg-card p-4 rounded-md z-10 flex flex-col gap-2">
        <h1 className="text-xl">
          {t('search.hero_title', {
            ns: 'dynamic',
            defaultValue: t('search.hero_title', { ns: 'common' }),
          })}
        </h1>

        <HomePageSearch />
      </div>

      {!appConfig.pages.home.disableTour && (
        <Button
          className="z-10"
          variant="default"
          size="lg"
          onClick={enableTour}
        >
          {t('take_a_tour')}
        </Button>
      )}
    </div>
  );
}
