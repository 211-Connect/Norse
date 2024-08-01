import {
  Box,
  Button,
  Indicator,
  MediaQuery,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useEventStore } from '../../lib/hooks/useEventStore';
import { useTour } from '@reactour/tour';
import { useMemo } from 'react';
import { HomePageSearch } from '../molecules/HomePageSearch';
import { useAppConfig } from '../../lib/hooks/useAppConfig';

export function HeroSection() {
  const appConfig = useAppConfig();
  const { setIsOpen, setSteps } = useTour();
  const { createTourEvent } = useEventStore();
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
      <Stack
        align="center"
        pos="relative"
        justify="center"
        h="100vh"
        mah="450px"
        spacing="xs"
      >
        <Image
          fill
          src={appConfig.pages.home.heroSection.backgroundImageUrl}
          priority
          alt=""
          style={{ objectFit: 'cover', zIndex: -1, objectPosition: 'center' }}
        />

        <Box
          w="100%"
          maw="460px"
          bg="background.0"
          p="md"
          sx={{ borderRadius: theme.radius.md }}
        >
          <Title order={1} size="h3" color="primary" mb="md">
            {t('search.hero_title', {
              ns: 'dynamic',
              defaultValue: t('search.hero_title', { ns: 'common' }),
            })}
          </Title>

          <HomePageSearch />
        </Box>

        {!appConfig.pages.home.disableTour && (
          <Indicator
            inline
            mt="lg"
            color="red"
            size={12}
            label={t('new')}
            styles={{ indicator: { padding: theme.spacing.md } }}
          >
            <Button color="primary" onClick={enableTour}>
              {t('take_a_tour')}
            </Button>
          </Indicator>
        )}
      </Stack>
    </MediaQuery>
  );
}
