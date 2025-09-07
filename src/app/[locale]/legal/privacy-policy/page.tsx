import { getAppConfig } from '@/app/shared/lib/appConfig';
import initTranslations from '@/app/shared/i18n/i18n';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { notFound } from 'next/navigation';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';

const i18nNamespaces = ['common', 'page-404', 'dynamic'];

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const appConfig = getAppConfig();

  return (
    appConfig?.nextConfig?.i18n?.locales?.map((locale: string) => ({
      locale,
    })) || []
  );
}

export const generateMetadata = async ({ params }) => {
  const appConfig = getAppConfig();
  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  if (!appConfig?.pages?.privacyPolicy?.enabled) {
    return {
      robots: {
        index: false,
      },
      description: t('meta_description', { ns: 'page-404' }),
      title: t('meta_title', { ns: 'page-404' }),
    };
  }

  const title = t('privacy_policy.title', { ns: 'dynamic' });

  return {
    openGraph: {
      description: title,
      images: appConfig?.brand?.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title,
    },
    description: title,
    title,
  };
};

export default async function PrivacyPolicyPage({ params }) {
  const appConfig = getAppConfig();

  if (!appConfig?.pages?.privacyPolicy?.enabled) {
    notFound();
  }

  const { locale } = await params;
  const cookieList = await getCookies({ cookies });
  const { t, i18n, resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <div className="container mx-auto pb-8 pt-8">
        <h1 className="mb-2 text-3xl font-bold">
          {t('privacy_policy.title', { ns: 'dynamic' })}
        </h1>

        {i18n.exists('privacy_policy.content', { ns: 'dynamic' }) ? (
          <div
            dangerouslySetInnerHTML={{
              __html: t('privacy_policy.content', { ns: 'dynamic' }),
            }}
          />
        ) : (
          <>
            <p className="mb-2">
              This web app collects certain information from users of the app.
              All data collected is completely anonymous, unless you expressly
              give us permission to store it (as in the case of registering for
              an account).
            </p>

            <h2 className="mb-2 mt-4 text-xl font-bold">
              What data we collect
            </h2>

            <p className="mb-2">
              We collect anonymized browsing data such as keywords being
              searched for, and which resource get viewed the most.
            </p>
            <p className="mb-2">
              We do <strong>not</strong> connect this data to personally
              identifiable information. It&apos;s collected and stored
              anonymously.
            </p>
            <p className="mb-2">
              In the case of visitors who register a user account, we also store
              information (such as email and username), provided voluntarily, in
              a secure database for purpose of letting you save resources in a
              list.
            </p>

            <h2 className="mb-2 mt-4 text-xl font-bold">Why we collect data</h2>
            <p className="mb-2">
              User accounts are, of course, collected so that you can save
              settings and resources for later access.
            </p>
            <p className="mb-2">
              Anonymous tracking data is stored so that we can improve the user
              experience, and determine how effective our tools are.
            </p>

            <h2 className="mb-2 mt-4 text-xl font-bold">How we collect data</h2>
            <p className="mb-2">Data is collected one of two ways:</p>
            <ol className="mb-2 list-disc pl-8">
              <li>Anonymously using Google Analytics tracking scripts.</li>
              <li>
                Through form fields that are filled out voluntarily by viewers.
              </li>
            </ol>

            <h2 className="mb-2 mt-4 text-xl font-bold">
              Who we share your data with
            </h2>
            <p className="mb-2">
              Data is stored in a few third party servers, such as Google
              Analytics, and on databases hosted in places like Amazon. These
              are basic services that are required to run this app. We cannot
              operate without them. They adhere to strict industry policies of
              security and privacy. They will not share your data without our
              permission, and we will not share it without <strong>your</strong>{' '}
              consent.
            </p>
            <p className="mb-2">
              We <strong>never</strong> share identifiable data with third
              parties without your express consent.
            </p>

            <h2 className="mb-2 mt-4 text-xl font-bold">
              How to have your data removed
            </h2>
            <p className="mb-2">
              If you would like us to remove your user account, please email
              from the email you used to sign up, asking us to remove your
              account.
            </p>

            <h2>Additional questions</h2>
            <p className="mb-2">
              If you have any other questions about what data we collect, or
              what we do with it, please direct questions to:
            </p>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
