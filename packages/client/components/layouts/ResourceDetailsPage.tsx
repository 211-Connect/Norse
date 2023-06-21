import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { Flex, Stack, useMantineTheme, MediaQuery } from '@mantine/core';
import Head from 'next/head';
import { ForwardedRef, forwardRef } from 'react';

type Props = {
  metaTitle: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  resourceNavigationSection: React.ReactNode;
  resourceOverviewSection: React.ReactNode;
  resourceInformationSection: React.ReactNode;
  resourceOrganizationSection: React.ReactNode;
  footerSection: React.ReactNode;
};

export const ResourceDetailsPageLayout = forwardRef(
  function ResourceDetailsPage(props: Props, ref: ForwardedRef<any>) {
    const theme = useMantineTheme();
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

        <Stack spacing={0} ref={ref}>
          {props.headerSection}
          {props.resourceNavigationSection}

          <MediaQuery smallerThan="sm" styles={{ flexDirection: 'column' }}>
            <Flex
              direction="row"
              p="md"
              w="100%"
              h="100%"
              maw="1100px"
              m="0 auto"
              sx={{
                '@media print': {
                  flexDirection: 'column',
                },
              }}
            >
              <MediaQuery
                smallerThan="sm"
                styles={{
                  maxWidth: 'initial',
                  marginRight: 0,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Stack spacing="md" w="100%" maw="50%" mr="sm">
                  {props.resourceOverviewSection}
                </Stack>
              </MediaQuery>

              <MediaQuery
                smallerThan="sm"
                styles={{ maxWidth: 'initial', marginLeft: 0 }}
              >
                <Stack h="100%" w="100%" maw="50%" ml="sm">
                  {props.resourceInformationSection}
                  {props.resourceOrganizationSection}
                </Stack>
              </MediaQuery>
            </Flex>
          </MediaQuery>

          {props.footerSection}
        </Stack>
      </>
    );
  }
);
