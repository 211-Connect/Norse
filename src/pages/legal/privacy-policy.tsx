import { AppFooter } from '../../components/app-footer';
import { AppHeader } from '../../components/app-header';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useAppConfig } from '@/hooks/use-app-config';
import { serverSideAppConfig } from '@/lib/server-utils';
import RenderHtml from '@/components/render-html';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const fs = await import('fs/promises');
  const path = await import('path');

  let privacyPolicy = '';
  try {
    privacyPolicy = (
      await fs.readFile(
        path.resolve('./public', 'templates', 'pages', 'privacy-policy.html'),
      )
    ).toString();
  } catch (err) {
    console.log(err);
  }

  return {
    props: {
      html: privacyPolicy,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'common',
        'menus',
      ])),
    },
  };
}

export default function PrivacyPolicy({ html = '' }: { html: string }) {
  const appConfig = useAppConfig();

  return (
    <>
      <Head>
        <title>Privacy Policy</title>
        <meta name="description" content="Privacy Policy" />

        <meta property="og:title" content="Privacy Policy" />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="Privacy Policy" />
      </Head>
      <AppHeader />
      <div className="container mx-auto">
        <RenderHtml html={html} />
      </div>
      <AppFooter />
    </>
  );
}
