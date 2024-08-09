import { MediaQuery, Stack, Text, useMantineTheme } from '@mantine/core';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useTour } from '@reactour/tour';
import { useMemo } from 'react';
import { useAppConfig } from '@/lib/hooks/useAppConfig';
import { createTourEvent } from '@/shared/lib/google-tag-manager';
import { HomePageSearch } from '@/components/molecules/HomePageSearch';
import { Button } from '@/shared/components/ui/button';
import { SearchBar } from '@/shared/components/search-bar';

export function HeroSection() {
  const appConfig = useAppConfig();
  const { setIsOpen, setSteps } = useTour();
  const theme = useMantineTheme();
  const { t } = useTranslation('page-home');

  const tourSteps = useMemo(() => {
    const steps = [
      {
        selector: '.search-box',
        content: (
          <Stack>
            <Text>{t('tour.step_1.paragraph_1')}</Text>
            <Text>{t('tour.step_1.paragraph_2')}</Text>
            <Text>{t('tour.step_1.paragraph_3')}</Text>
          </Stack>
        ),
      },
      {
        selector: '.categories',
        content: (
          <Stack>
            <Text>{t('tour.step_2.paragraph_1')}</Text>
            <Text>{t('tour.step_2.paragraph_2')}</Text>
          </Stack>
        ),
      },
    ];

    if (appConfig.contact.feedbackUrl) {
      steps.push({
        selector: '.feedback',
        content: (
          <Stack>
            <Text>{t('tour.step_3.paragraph_1')}</Text>
            <Text>{t('tour.step_3.paragraph_2')}</Text>
          </Stack>
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
    <MediaQuery
      smallerThan="xs"
      styles={{
        paddingRight: theme.spacing.md,
        paddingLeft: theme.spacing.md,
        maxHeight: '250px',
      }}
    >
      <div className="relative flex h-screen max-h-96 flex-col items-center justify-center gap-2">
        <Image
          fill
          src={appConfig.pages.home.heroSection.backgroundImageUrl}
          priority
          alt=""
          style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
        />

        <div className="flex w-full max-w-96 flex-col gap-2 rounded-md bg-white p-2">
          <h3 className="text-xl font-bold">
            {t('search.hero_title', {
              ns: 'dynamic',
              defaultValue: t('search.hero_title', { ns: 'common' }),
            })}
          </h3>

          <SearchBar />
          <HomePageSearch />
        </div>

        {!appConfig.pages.home.disableTour && (
          <Button onClick={enableTour}>{t('take_a_tour')}</Button>
        )}
      </div>
    </MediaQuery>
  );
}
