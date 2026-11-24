import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';

import {
  HtmlSitemap,
  SitemapTopicList,
} from '@/app/(app)/features/landing-pages/components/html-sitemap';
import {
  sitemapLocales,
  splitsByTopic,
} from '@/app/(app)/features/landing-pages/lib/htmlSitemap';
import { landingAlternates } from '@/app/(app)/features/landing-pages/lib/seo';
import { localizedLandingHref } from '@/app/(app)/features/landing-pages/lib/slugs';
import { getHtmlSitemap } from '@/app/(app)/features/landing-pages/server/html-sitemap';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { protectPage } from '@/lib/arcjet-page';

const i18nNamespaces = ['common'];

type Props = { params: Promise<{ locale: string }> };

/** The landing pages' HTML sitemap (docs/landing-pages.md, "Sitemaps"). */
export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { locale } = await params;
  await protectPage(`/${locale}/sitemap`);
  const { appConfig, sitemap, origin, linkLocale } =
    await getHtmlSitemap(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
  const title = `${t('footer.sitemap')} | ${appConfig.brand.name}`;
  return {
    title,
    // Another locale's pages: not this locale's sitemap. Never loosens the
    // layout's `noindex, nofollow` on a deployment that blocks crawlers.
    ...(linkLocale !== locale &&
      !shouldBlockCrawlers(false) && {
        robots: { index: false, follow: true },
      }),
    alternates: landingAlternates({
      origin,
      locale,
      defaultLocale: appConfig.i18n.defaultLocale,
      alternates: Object.fromEntries(
        sitemapLocales(sitemap).map((l) => [l, 'sitemap']),
      ),
      page: 1,
    }),
  };
};

export default async function SitemapPage({ params }: Props) {
  const [{ locale }, cookieList, headersList] = await Promise.all([
    params,
    getCookies({ cookies }),
    headers(),
  ]);
  await protectPage(`/${locale}/sitemap`);
  const { appConfig, topics, linkLocale } = await getHtmlSitemap(locale);
  const { t, resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
  const href = (path: string) =>
    localizedLandingHref(path, linkLocale, appConfig.i18n.defaultLocale);

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={headersList.get('x-nonce') ?? ''}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">{t('footer.sitemap')}</h1>
        {splitsByTopic(topics) ? (
          <SitemapTopicList topics={topics} href={href} />
        ) : (
          <HtmlSitemap topics={topics} href={href} />
        )}
      </div>
    </PageWrapper>
  );
}
