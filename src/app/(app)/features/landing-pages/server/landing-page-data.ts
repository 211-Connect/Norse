import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import { type RawSearchParams } from '@/app/(app)/features/search/intent';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import {
  MAP_PINS_LIMIT,
  lastPageWithinPinLimit,
} from '@/app/(app)/features/search/utils/map-pins';
import { toPinsQuery } from '@/app/(app)/shared/lib/search-params';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { findResources } from '@/app/(app)/shared/services/search-service';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getHost } from '@/app/(app)/shared/utils/getHost';
import { createLogger } from '@/lib/logger';
import { type AppConfig } from '@/types/appConfig';
import { type FiltersMap } from '@/types/search';

import { landingAreas } from '../lib/areas';
import { type CopyField, fillCopy, regionDisplayName } from '../lib/copy';
import { hubPages } from '../lib/hub';
import {
  isRefinedRequest,
  landingRefinements,
  requestedPage,
} from '../lib/search';
import { redirectHref } from '../lib/seo';
import { STATE_NAMES, localizedLandingHref } from '../lib/slugs';
import { type LandingPageStrings, loadLandingStrings } from '../lib/strings';
import type { LandingLink, LandingPageView, LandingRegion } from '../lib/types';
import { getLandingResolution, getLandingSitemap } from './landing-data';
import {
  LANDING_SEARCH_TTL,
  type LandingSearchPage,
  landingSearch,
} from './landing-search';

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
/** One list of links under "Search for services in other regions". */
export type LandingAreaGroup = { heading: string; links: LandingChildLink[] };

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

  const links = (list: LandingLink[]): LandingChildLink[] =>
    list.map((link) => ({ label: nameOf(link.region), href: href(link.path) }));
  const fill = (text: string, place: string) =>
    text.replace(/\{\{\s*location\s*\}\}/g, place);
  const { page: labels } = strings;
  const county = page.parents.find((p) => p.region.type === 'county');
  const childLevel = page.children[0]?.region.type;
  const areas: LandingAreaGroup[] = [
    {
      heading: fill(
        childLevel === 'county' ? labels.counties : labels.cities,
        location,
      ),
      links: links(page.children),
    },
    {
      heading:
        page.region.type === 'state'
          ? labels.otherStates
          : page.region.type === 'county'
            ? fill(labels.otherCounties, stateName)
            : fill(
                labels.otherCities,
                county ? nameOf(county.region) : stateName,
              ),
      links: links(page.siblings ?? []),
    },
  ].filter((group) => group.links.length > 0);

  return {
    copy,
    location,
    crumbs,
    areas,
    labels: strings.page satisfies LandingPageStrings,
  };
}

/**
 * `/{topic-slug}`: the topic's search across the whole tenant, with links to
 * its top-level pages (docs/landing-pages.md, "Topic hub"). 404 when the
 * topic has no live page in the locale. Cached per request.
 */
export const getLandingHub = cache(async (locale: string, topic: string) => {
  const appConfig = await getAppConfigWithoutHost(locale);
  if (!servesLandingPages(appConfig)) notFound();
  const sitemap = await getLandingSitemap(appConfig.tenantId);
  const hub = hubPages(sitemap, topic, locale);
  if (!hub) notFound();

  // The topic's search and name, from one of its pages: already cached.
  const resolution = await getLandingResolution(
    appConfig.tenantId,
    locale,
    hub.pages[0].path,
  );
  if (resolution.kind !== 'page') notFound();
  const { topic: topicView } = resolution.page;

  const strings = await loadLandingStrings(locale);
  const { defaultLocale } = appConfig.i18n;
  const { page: labels } = strings;
  const stateOf = (region: LandingRegion) =>
    STATE_NAMES[region.state] ?? region.state;
  const links = (list: LandingLink[]): LandingChildLink[] =>
    list
      .map((link) => ({
        label: regionDisplayName(
          link.region,
          strings.region,
          stateOf(link.region),
        ),
        href: localizedLandingHref(link.path, locale, defaultLocale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  const fill = (text: string, place: string) =>
    text.replace(/\{\{\s*location\s*\}\}/g, place);

  const top = hub.pages[0].region;
  const areas: LandingAreaGroup[] = [
    {
      heading:
        top.type === 'state'
          ? labels.states
          : fill(
              top.type === 'county' ? labels.counties : labels.cities,
              stateOf(top),
            ),
      links: links(hub.pages),
    },
  ];
  // One state: its counties (or cities) too, so the hub reaches them.
  if (top.type === 'state' && hub.pages.length === 1) {
    const { children } = landingAreas(top, hub.all);
    const level = children[0]?.region.type;
    areas.push({
      heading: fill(
        level === 'county' ? labels.counties : labels.cities,
        stateOf(top),
      ),
      links: links(children),
    });
  }

  return {
    appConfig,
    topic: topicView,
    alternates: hub.alternates,
    path: localizedLandingHref(topic, locale, defaultLocale),
    crumbs: [
      {
        label: labels.home,
        href: locale === defaultLocale ? '/' : `/${locale}`,
      },
      { label: topicView.name },
    ] satisfies LandingCrumb[],
    areas: areas.filter((group) => group.links.length > 0),
    labels,
  };
});

/**
 * The page's results: the topic's search on the page's region (the whole
 * tenant for a hub), refined by the query string, through the same pipeline
 * as `/search`.
 */
export async function getLandingResults(
  appConfig: AppConfig,
  /** A page, or a topic's hub (no region); `id` is for logs. */
  page: LandingSearchPage & { id: string },
  locale: string,
  searchParams: RawSearchParams,
) {
  const {
    searchEngine,
    showAllResultsOnMap,
    resultsLimit: limit,
  } = appConfig.search;
  const {
    base,
    intent,
    query: searchQuery,
  } = await landingSearch(appConfig, page, locale, searchParams);

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
    { ttl: LANDING_SEARCH_TTL },
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
