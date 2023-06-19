import { useAppConfig } from '$lib/hooks/useAppConfig';
import { Flex, MediaQuery, Stack } from '@mantine/core';
import Head from 'next/head';

type Props = {
  metaTitle: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  favoritesListSection: React.ReactNode;
  mapSection: React.ReactNode;
  footerSection: React.ReactNode;
};

export function FavoritesPageLayout(props: Props) {
  const appConfig = useAppConfig();

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
      <Flex direction="column">
        {props.headerSection}

        <Flex>
          <MediaQuery smallerThan="sm" styles={{ maxWidth: 'initial' }}>
            <Stack maw="550px" w="100%" id="search-container">
              {props.favoritesListSection}
            </Stack>
          </MediaQuery>

          <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
            <Flex
              w="100%"
              h="calc(100vh - 80px)"
              pos="relative"
              id="map-container"
            >
              <Flex w="100%" h="100%">
                {props.mapSection}
              </Flex>
            </Flex>
          </MediaQuery>
        </Flex>

        {props.footerSection}
      </Flex>
    </>
  );
}
