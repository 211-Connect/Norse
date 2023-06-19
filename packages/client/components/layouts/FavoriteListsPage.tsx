import { Flex, MediaQuery, Stack, Text } from '@mantine/core';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';

type Props = {
  title: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  favoriteListSection: React.ReactNode;
  mapSection: React.ReactNode;
  footerSection: React.ReactNode;
};

export function FavoriteListsPageLayout(props: Props) {
  const { t } = useTranslation('page-favorites');

  return (
    <>
      <Head>
        <title>{props.title}</title>
        <meta name="description" content={props.metaDescription} />
      </Head>

      <Stack h="100vh" spacing={0} sx={{ overflow: 'hidden' }}>
        {props.headerSection}
        <Flex w="100%" h="100%" sx={{ overflow: 'hidden', flex: 1 }}>
          <MediaQuery smallerThan="sm" styles={{ maxWidth: 'initial' }}>
            <Stack
              maw="550px"
              w="100%"
              sx={{ overflowY: 'auto', gap: 0 }}
              id="search-container"
            >
              {props.favoriteListSection}
            </Stack>
          </MediaQuery>

          <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
            <Flex
              w="100%"
              h="100%"
              pos="relative"
              id="map-container"
              sx={{ position: 'relative' }}
            >
              <Flex
                bg="rgba(0,0,0,0.6)"
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  zIndex: 1,
                }}
                justify="center"
                align="center"
              >
                <Text color="#fff" size="lg">
                  {t('select_a_list')}
                </Text>
              </Flex>

              <Flex w="100%" h="100%">
                {props.mapSection}
              </Flex>
            </Flex>
          </MediaQuery>
        </Flex>
        {props.footerSection}
      </Stack>
    </>
  );
}
