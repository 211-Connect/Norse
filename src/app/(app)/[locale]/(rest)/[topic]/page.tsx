import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Metadata } from 'next/types';
import { cache } from 'react';

import { LandingHeader } from '@/app/(app)/features/landing-pages/components/landing-header';
import { regionDisplayName } from '@/app/(app)/features/landing-pages/lib/copy';
import { hubPages } from '@/app/(app)/features/landing-pages/lib/hub';
import { landingAlternates } from '@/app/(app)/features/landing-pages/lib/seo';
import {
  STATE_NAMES,
  localizedLandingHref,
} from '@/app/(app)/features/landing-pages/lib/slugs';
import { loadLandingStrings } from '@/app/(app)/features/landing-pages/lib/strings';
import { getLandingSitemap } from '@/app/(app)/features/landing-pages/server/landing-data';
import {
  landingOrigin,
  servesLandingPages,
} from '@/app/(app)/features/landing-pages/server/landing-page-data';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { protectPage } from '@/lib/arcjet-page';

const i18nNamespaces = ['common'];

type Props = { params: Promise<{ locale: string; topic: string }> };

/**
 * `/{topic-slug}`: a 308 to the topic's state page when the tenant covers one
 * state, else a list of its top-level pages; 404 for anything else
 * (docs/landing-pages.md, "URLs").
 */
const getHub = cache(async (locale: string, topic: string) => {
  const appConfig = await getAppConfigWithoutHost(locale);
  if (!servesLandingPages(appConfig)) notFound();
  const sitemap = await getLandingSitemap(appConfig.tenantId);
  const hub = hubPages(sitemap, topic, locale);
  if (!hub) notFound();
  const { defaultLocale } = appConfig.i18n;
  if (hub.pages.length === 1) {
    permanentRedirect(
      localizedLandingHref(hub.pages[0].path, locale, defaultLocale),
    );
  }
  const strings = await loadLandingStrings(locale);
  const links = hub.pages
    .map((page) => ({
      href: localizedLandingHref(page.path, locale, defaultLocale),
      label: regionDisplayName(
        page.region,
        strings.region,
        STATE_NAMES[page.region.state] ?? page.region.state,
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const topicName =
    sitemap.topics[hub.topicId]?.[locale] ??
    sitemap.topics[hub.topicId]?.[defaultLocale] ??
    topic;
  return {
    appConfig,
    links,
    topicName,
    alternates: hub.alternates,
    home: {
      label: strings.page.home,
      href: locale === defaultLocale ? '/' : `/${locale}`,
    },
    breadcrumbsLabel: strings.page.breadcrumbs,
  };
});

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { locale, topic } = await params;
  await protectPage(`/${locale}/${topic}`);
  const { appConfig, topicName, alternates } = await getHub(locale, topic);
  const origin = await landingOrigin(appConfig);
  return {
    title: `${topicName} | ${appConfig.brand.name}`,
    alternates: landingAlternates({
      origin,
      locale,
      defaultLocale: appConfig.i18n.defaultLocale,
      alternates,
      page: 1,
    }),
  };
};

export default async function LandingHubPage({ params }: Props) {
  const [{ locale, topic }, cookieList, headersList] = await Promise.all([
    params,
    getCookies({ cookies }),
    headers(),
  ]);
  await protectPage(`/${locale}/${topic}`);
  const { appConfig, links, topicName, home, breadcrumbsLabel } = await getHub(
    locale,
    topic,
  );
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={headersList.get('x-nonce') ?? ''}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <LandingHeader
          crumbs={[home, { label: topicName }]}
          crumbsLabel={breadcrumbsLabel}
          h1={topicName}
          intro=""
        />
        <ul className="bg-background grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border p-4 sm:grid-cols-2 md:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-primary underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageWrapper>
  );
}
