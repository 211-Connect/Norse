import { parseHtml } from '../../lib/utils/parseHtml';
import PrivacyPolicyPage from '../../components/layouts/PrivacyPolicyPage';
import { AppFooter } from '../../components/organisms/AppFooter';
import { AppHeader } from '../../components/organisms/AppHeader';
import { GetStaticPropsContext } from 'next';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const fs = await import('fs/promises');
  const path = await import('path');

  let privacyPolicy = '';
  try {
    privacyPolicy = (
      await fs.readFile(
        path.resolve('./public', 'templates', 'pages', 'privacy-policy.html')
      )
    ).toString();
  } catch (err) {
    console.log(err);
  }

  return {
    props: {
      html: privacyPolicy,
      ...(await serverSideTranslations(ctx.locale as string)),
    },
  };
}

export default function PrivacyPolicy({ html = '' }: { html: string }) {
  const session = useSession();

  if (session.status === 'loading') return null;

  return (
    <PrivacyPolicyPage
      metaTitle="Privacy Policy"
      metaDescription="Privacy Policy"
      headerSection={<AppHeader />}
      body={parseHtml(html)}
      footerSection={<AppFooter />}
    />
  );
}
