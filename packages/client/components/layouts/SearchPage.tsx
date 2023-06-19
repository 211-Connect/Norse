import { useAppConfig } from '$lib/hooks/useAppConfig';
import { Flex, Stack, MediaQuery, Box, useMantineTheme } from '@mantine/core';
import { useMediaQuery, useWindowScroll } from '@mantine/hooks';
import Head from 'next/head';
import { useEffect } from 'react';

type Props = {
  metaTitle: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  filterPanelSection: React.ReactNode;
  resultsSection: React.ReactNode;
  mapSection: React.ReactNode;
  footerSection: React.ReactNode;
};

export function SearchPageLayout(props: Props) {
  const theme = useMantineTheme();
  const [scroll] = useWindowScroll();
  const mapHidden = useMediaQuery('(max-width: 768px)');
  const appConfig = useAppConfig();

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(scroll.y, 0), 80) - 80)
  );

  useEffect(() => {
    if (mapHidden) return;
    window.dispatchEvent(new Event('resize'));
  }, [clampedWindowValue, mapHidden]);

  return (
    <>
      <Head>
        <title>{props.metaTitle}</title>
        <meta name="description" content={props.metaDescription} />

        <meta property="og:title" content={props.metaTitle} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={props.metaDescription} />
      </Head>

      {props.headerSection}

      <Flex w="100%" h="100%" sx={{ position: 'relative' }} pb="md">
        {props.filterPanelSection}

        <MediaQuery smallerThan="sm" styles={{ maxWidth: 'initial' }}>
          <Stack
            spacing="md"
            pt="md"
            maw="550px"
            w="100%"
            sx={{ overflowY: 'auto' }}
            id="search-container"
          >
            {props.resultsSection}
          </Stack>
        </MediaQuery>

        <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
          <Box w="100%">
            <Flex
              w="100%"
              pl="md"
              pr="md"
              pos="sticky"
              top={theme.spacing.md}
              id="map-container"
              mt="md"
              sx={{
                height: `calc(100vh - ${clampedWindowValue}px - ${theme.spacing.md}px - ${theme.spacing.md}px)`,
              }}
            >
              <Flex
                w="100%"
                h="100%"
                pos="relative"
                sx={{
                  borderRadius: theme.radius.lg + 'px',
                  overflow: 'hidden',
                }}
              >
                {props.mapSection}
              </Flex>
            </Flex>
          </Box>
        </MediaQuery>
      </Flex>

      {props.footerSection}
    </>
  );
}
