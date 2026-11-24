import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import {
  toFindResourcesQuery,
  type RawSearchParams,
} from '@/app/(app)/features/search/intent';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import {
  MAP_PINS_LIMIT,
  lastPageWithinPinLimit,
} from '@/app/(app)/features/search/utils/map-pins';
import { liftSearchRequest } from '@/app/(app)/features/search/utils/liftSearchRequest';
import { withAreaSettings } from '@/app/(app)/features/search/utils/withAreaSettings';
import { toPinsQuery } from '@/app/(app)/shared/lib/search-params';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { findResources } from '@/app/(app)/shared/services/search-service';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getHost } from '@/app/(app)/shared/utils/getHost';
import { createLogger } from '@/lib/logger';
import { type AppConfig } from '@/types/appConfig';
import { type FiltersMap } from '@/types/search';

import { type CopyField, fillCopy, regionDisplayName } from '../lib/copy';
import {
  isRefinedRequest,
  landingBaseParams,
  landingRefinements,
  landingSearchParams,
  requestedPage,
} from '../lib/search';
import { redirectHref } from '../lib/seo';
import { STATE_NAMES, localizedLandingHref } from '../lib/slugs';
import { type LandingPageStrings, loadLandingStrings } from '../lib/strings';
import type { LandingPageView, LandingRegion } from '../lib/types';
import { getLandingResolution } from './landing-data';

const log = createLogger('landing-page');

/**
 * Whether the tenant serves landing pages: the feature flag on, and the
 * domain not de-indexed (a `noindex` tenant would only serve pages nobody
 * finds).
 */
export function servesLandingPages(appConfig: AppConfig): boolean {
  return appConfig.featureFlags.enableLandingPages && !appConfig.noindex;
}

/**
 * `https://host[/basePath]` for canonical, hreflang and sitemap URLs: the
 * tenant's canonical host, else the request's.
 */
export async function landingOrigin(appConfig: AppConfig): Promise<string> {
  const { host, protocol } = await getHost();
  const scheme = protocol.split(',')[0]?.trim() || 'https';
  return withOptionalCustomBasePath(
    `${scheme}://${appConfig.canonicalHost ?? host}`,
  ).replace(/\/$/, '');
}

const queryOf = (params: RawSearchParams): string => {
  const pairs = Object.entries(params).flatMap(([key, value]) =>
    value === undefined
      ? []
      : (Array.isArray(value) ? value : [value]).map((v) => [key, v]),
  );
  const query = new URLSearchParams(pairs).toString();
  return query ? `?${query}` : '';
};

/**
 * The resolved page, or the redirect / 404 it answers with. Cached per
 * request, so the metadata and the page share one lookup.
 */
export const getLandingPage = cache(
  async (
    locale: string,
    topic: string,
    place: string,
    // The query string, so a redirect keeps the visitor's refinements.
    refinementQuery: string,
  ): Promise<{ appConfig: AppConfig; page: LandingPageView }> => {
    const appConfig = await getAppConfigWithoutHost(locale);
    if (!servesLandingPages(appConfig)) notFound();

    const resolution = await getLandingResolution(
      appConfig.tenantId,
      locale,
      `${topic}/${place}`,
    );
    if (resolution.kind === 'redirect') {
      permanentRedirect(
        redirectHref(resolution.path, locale, appConfig.i18n.defaultLocale) +
          refinementQuery,
      );
    }
    // A gone page answers 404: the App Router has no 410 (see the doc).
    if (resolution.kind !== 'page') notFound();
    return { appConfig, page: resolution.page };
  },
);

/** The page's request, as the route receives it. */
export type LandingRequest = {
  locale: string;
  topic: string;
  place: string;
  searchParams: RawSearchParams;
};

export async function resolveLandingRequest({
  locale,
  topic,
  place,
  searchParams,
}: LandingRequest) {
  return getLandingPage(
    locale,
    topic,
    place,
    queryOf(landingRefinements(searchParams)),
  );
}

export type LandingCrumb = { label: string; href?: string };
export type LandingChildLink = { label: string; href: string };

/** The page's texts and links, in its locale. */
export async function getLandingContent(
  appConfig: AppConfig,
  page: LandingPageView,
  locale: string,
) {
  const strings = await loadLandingStrings(locale);
  const { defaultLocale } = appConfig.i18n;
  const nameOf = (region: LandingRegion) =>
    regionDisplayName(
      region,
      strings.region,
      STATE_NAMES[region.state] ?? region.state,
    );
  const href = (path: string) =>
    localizedLandingHref(path, locale, defaultLocale);

  const location = nameOf(page.region);
  const stateName = STATE_NAMES[page.region.state] ?? page.region.state;
  const copy: Record<CopyField, string> = fillCopy(
    {
      topic: page.topic.copy,
      template: appConfig.landingPages.templates,
      default: strings.defaults,
    },
    {
      topic: page.topic.name,
      location,
      state: stateName,
      name: appConfig.brand.name,
      phone: appConfig.contact.number,
      email: appConfig.contact.email,
    },
  );

  const topicSlug = page.path.split('/')[0];
  const crumbs: LandingCrumb[] = [
    {
      label: strings.page.home,
      href: locale === defaultLocale ? '/' : `/${locale}`,
    },
    { label: page.topic.name, href: href(topicSlug) },
    ...page.parents.map((parent) => ({
      label: nameOf(parent.region),
      href: href(parent.path),
    })),
    { label: location },
  ];

  const children: LandingChildLink[] = page.children
    .map((child) => ({ label: nameOf(child.region), href: href(child.path) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const childrenType = page.children[0]?.region.type;
  const childrenHeading = (
    childrenType === 'county' ? strings.page.counties : strings.page.cities
  ).replace(/\{\{\s*location\s*\}\}/g, location);

  return {
    copy,
    location,
    crumbs,
    children,
    childrenHeading,
    labels: strings.page satisfies LandingPageStrings,
  };
}

/**
 * The page's results: the topic's search on the page's region, refined by
 * the query string, through the same pipeline as `/search`.
 */
export async function getLandingResults(
  appConfig: AppConfig,
  page: LandingPageView,
  location: string,
  locale: string,
  searchParams: RawSearchParams,
) {
  const {
    searchEngine,
    showAllResultsOnMap,
    resultsLimit: limit,
  } = appConfig.search;
  const base = landingBaseParams({
    search: page.topic.search,
    topicName: page.topic.name,
    regionId: page.region.id,
    location,
    searchEngine,
  });
  const raw = landingSearchParams(base, searchParams);
  const { intent } = liftSearchRequest(raw);
  const searchQuery = withAreaSettings(toFindResourcesQuery(intent), appConfig);

  const wanted = requestedPage(searchParams);
  const currentPage = showAllResultsOnMap
    ? Math.min(wanted, lastPageWithinPinLimit(limit))
    : wanted;

  const result = await findResources(
    searchQuery,
    locale,
    currentPage,
    limit,
    appConfig.tenantId,
    searchEngine,
  );
  if (!result) {
    log.warn(
      { tenantId: appConfig.tenantId, pageId: page.id, locale },
      'Landing search returned no result object; showing no results',
    );
  }
  const results = (result?.results ?? []) as ResultType[];
  const totalResults = result?.totalResults ?? 0;
  const filters: FiltersMap = result?.filters ?? {};
  const listTotal = showAllResultsOnMap
    ? Math.min(totalResults, MAP_PINS_LIMIT)
    : totalResults;

  return {
    base,
    intent,
    searchQuery,
    results,
    totalResults,
    listTotal,
    filters,
    currentPage,
    pinsQuery: showAllResultsOnMap
      ? toPinsQuery(searchQuery, locale, searchEngine)
      : null,
    refined: isRefinedRequest(searchParams),
    cardLayout: appConfig.search.cardLayout ?? DEFAULT_SEARCH_CARD_LAYOUT,
  };
}
