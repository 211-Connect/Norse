import { useAppConfig } from '$lib/hooks/useAppConfig';
import { Box } from '@mantine/core';
import Head from 'next/head';

type Props = {
  metaTitle: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  body: React.ReactNode;
  footerSection: React.ReactNode;
};

export default function PrivacyPolicyPage(props: Props) {
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
      {props.headerSection}
      <Box maw="1200px" m="0 auto">
        {props.body}
      </Box>
      {props.footerSection}
    </>
  );
}
