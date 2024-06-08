import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useEventStore } from '@/hooks/use-event-store';
import { useTour } from '@reactour/tour';
import { useMemo } from 'react';
import { useAppConfig } from '@/hooks/use-app-config';
import { Button } from '../ui/button';
import Search from '../search';

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
    <div className="relative flex h-screen max-h-[350px] flex-col items-center justify-center gap-4 pl-2 pr-2 md:max-h-[450px] md:pl-0 md:pr-0">
      <Image
        fill
        src={appConfig.pages.home.heroSection.backgroundImageUrl}
        priority
        alt=""
        className="pointer-events-none z-0 object-cover object-center"
      />

      <div className="search-box z-20 flex w-full max-w-[460px] flex-col gap-2 rounded-md bg-card p-4">
        <h1 className="text-xl">{t('search.hero_title', { ns: 'common' })}</h1>

        <Search />
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
