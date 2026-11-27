import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

import { htmlSitemapTopics } from '../lib/htmlSitemap';
import { loadLandingStrings } from '../lib/strings';
import { getLandingSitemap } from './landing-data';
import { landingOrigin, servesLandingPages } from './landing-page-data';

/**
 * The locale's HTML sitemap data, from the cached page list
 * (`getLandingSitemap`, keyed on the landing-pages version). A locale with
 * no pages of its own lists the default locale's (`linkLocale`), so the
 * footer link never leads to a 404; that variant is `noindex`. 404 when the
 * host serves no landing pages or has none at all.
 */
export const getHtmlSitemap = cache(async (locale: string) => {
  const appConfig = await getAppConfigWithoutHost(locale);
  if (!servesLandingPages(appConfig)) notFound();
  const { defaultLocale } = appConfig.i18n;
  const [sitemap, origin] = await Promise.all([
    getLandingSitemap(appConfig.tenantId),
    landingOrigin(appConfig),
  ]);
  const topicsIn = async (linkLocale: string) =>
    htmlSitemapTopics(sitemap, {
      locale: linkLocale,
      defaultLocale,
      regionStrings: (await loadLandingStrings(linkLocale)).region,
    });
  let linkLocale = locale;
  let topics = await topicsIn(locale);
  if (topics.length === 0 && locale !== defaultLocale) {
    linkLocale = defaultLocale;
    topics = await topicsIn(defaultLocale);
  }
  if (topics.length === 0) notFound();
  return { appConfig, sitemap, topics, origin, linkLocale };
});
