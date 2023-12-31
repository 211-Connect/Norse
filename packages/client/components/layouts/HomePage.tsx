import { useAppConfig } from '../../lib/hooks/useAppConfig';
import Head from 'next/head';

type Props = {
  metaTitle: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  heroSection: React.ReactNode;
  categorySection: React.ReactNode;
  footerSection: React.ReactNode;
};

export function HomePageLayout(props: Props) {
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
      {props.heroSection}
      {props.categorySection}
      {props.footerSection}
    </>
  );
}
