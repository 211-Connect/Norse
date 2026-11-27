import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next/types';
import { cache } from 'react';

import { SitemapTopicTree } from '@/app/(app)/features/landing-pages/components/html-sitemap';
import { topicSlugsByLocale } from '@/app/(app)/features/landing-pages/lib/htmlSitemap';
import { landingAlternates } from '@/app/(app)/features/landing-pages/lib/seo';
import { localizedLandingHref } from '@/app/(app)/features/landing-pages/lib/slugs';
import { getHtmlSitemap } from '@/app/(app)/features/landing-pages/server/html-sitemap';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { protectPage } from '@/lib/arcjet-page';

const i18nNamespaces = ['common'];

type Props = { params: Promise<{ locale: string; topic: string }> };

/** One topic's part of the HTML sitemap, for `/sitemap` past the link limit. */
const getTopicSitemap = cache(async (locale: string, slug: string) => {
  const data = await getHtmlSitemap(locale);
  const topic = data.topics.find((t) => t.slug === slug);
  if (!topic) notFound();
  return { ...data, topic };
});

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { locale, topic: slug } = await params;
  await protectPage(`/${locale}/sitemap/${slug}`);
  const { appConfig, sitemap, origin, topic, linkLocale } =
    await getTopicSitemap(locale, slug);
  return {
    title: `${topic.name} | ${appConfig.brand.name}`,
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
        Object.entries(topicSlugsByLocale(sitemap, topic.id)).map(
          ([l, topicSlug]) => [l, `sitemap/${topicSlug}`],
        ),
      ),
      page: 1,
    }),
  };
};

export default async function TopicSitemapPage({ params }: Props) {
  const [{ locale, topic: slug }, cookieList, headersList] = await Promise.all([
    params,
    getCookies({ cookies }),
    headers(),
  ]);
  await protectPage(`/${locale}/sitemap/${slug}`);
  const { appConfig, topic, linkLocale } = await getTopicSitemap(locale, slug);
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
        <nav className="text-sm">
          <Link
            href={localizedLandingHref(
              'sitemap',
              locale,
              appConfig.i18n.defaultLocale,
            )}
            className="text-primary hover:underline"
          >
            {t('footer.sitemap')}
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold">{topic.name}</h1>
        <SitemapTopicTree topic={topic} href={href} />
      </div>
    </PageWrapper>
  );
}
