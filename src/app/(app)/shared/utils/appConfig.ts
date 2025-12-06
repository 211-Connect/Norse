import {
  ResourceDirectory,
  Tenant,
  TenantMedia,
} from '@/payload/payload-types';
import { TypedLocale } from 'payload';
import { findByHostCached } from '@/payload/collections/ResourceDirectories/services/findByHost';
import { cache } from 'react';
import { AppConfig } from '@/types/appConfig';
import { headers } from 'next/headers';
import { getHost } from './getHost';
import { defaultLocale } from '@/payload/i18n/locales';
import initTranslations from '../i18n/i18n';

function getMediaUrl(media?: TenantMedia | number | null): string | undefined {
  if (typeof media === 'number' || !media) return undefined;
  return media?.url || undefined;
}

function getTenant(resourceDirectory: ResourceDirectory): Tenant | undefined {
  if (typeof resourceDirectory.tenant === 'string') {
    return undefined;
  }

  return resourceDirectory.tenant ?? undefined;
}

function getTenantId(resourceDirectory: ResourceDirectory): string | undefined {
  if (typeof resourceDirectory.tenant === 'string') {
    return resourceDirectory.tenant;
  }

  return resourceDirectory.tenant?.id ?? undefined;
}

function getTenantI18n(resourceDirectory: ResourceDirectory): {
  defaultLocale: string;
  locales: string[];
} {
  if (typeof resourceDirectory.tenant === 'string') {
    return {
      defaultLocale,
      locales: [defaultLocale],
    };
  }

  return {
    defaultLocale: resourceDirectory.tenant?.defaultLocale || defaultLocale,
    locales: resourceDirectory.tenant?.enabledLocales || [defaultLocale],
  };
}

async function getAppConfigBase(
  host: string,
  locale: string,
): Promise<AppConfig> {
  const resourceDirectory = await findByHostCached(host, locale as TypedLocale);

  let map: AppConfig['search']['map'] = {
    center: [39.8283459, -98.5794797], // Center of USA
    zoom: 7,
  };

  if (!resourceDirectory) {
    return {
      baseUrl: '',
      brand: {
        name: '',
        theme: {},
      },
      contact: {},
      customBasePath: '',
      featureFlags: {
        hideCategoriesHeading: false,
        hideDataProvidersHeading: false,
        requireUserLocation: false,
        showHomePageTour: false,
        showPrintButton: false,
        showResourceCategories: false,
        showResourceAttribution: false,
        showResourceLastAssuredDate: false,
        showSearchAndResourceServiceName: false,
        showSuggestionListTaxonomyBadge: false,
        showUseMyLocationButtonOnDesktop: false,
        turnResourceCardTaxonomiesIntoLinks: true,
        useHybridSemanticSearch: false,
      },
      footer: {
        customMenu: [],
      },
      header: {
        customMenu: [],
      },
      i18n: {
        defaultLocale,
        locales: [defaultLocale],
      },
      meta: {
        description: '',
        title: '',
      },
      pages: {
        privacyPolicyPage: {
          enabled: false,
        },
        termsOfUsePage: {
          enabled: false,
        },
      },
      resource: {
        lastAssuredText: undefined,
      },
      search: {
        map,
        radiusOptions: [],
        resultsLimit: 25,
      },
      suggestions: [],
      topics: {
        iconSize: 'small',
        list: [],
      },
    };
  }

  const i18n = getTenantI18n(resourceDirectory);
  const errorNamespaces = ['page-500', 'common'];
  const { resources } = await initTranslations(
    locale,
    errorNamespaces,
    i18n.locales,
    i18n.defaultLocale,
  );

  const headerList = await headers();
  const baseUrl = `${headerList.get('x-forwarded-proto')}://${headerList.get('host')}`;

  try {
    const parsedCenter = JSON.parse(resourceDirectory.search.map.center);

    if (!Array.isArray(parsedCenter) || parsedCenter.length !== 2) {
      throw new Error('Parsed center is not an array');
    }

    map = {
      center: parsedCenter as [number, number],
      zoom: resourceDirectory.search.map.zoom,
    };
  } catch {}

  const newLayout: AppConfig['newLayout'] = resourceDirectory.newLayout
    ? {
        enabled: resourceDirectory.newLayout.enabled ?? false,
        headerStart: resourceDirectory.newLayout.headerStart ?? undefined,
        headerEnd: resourceDirectory.newLayout.headerEnd ?? undefined,
        heroUrl: getMediaUrl(resourceDirectory.newLayout.hero),
        logoUrl: getMediaUrl(resourceDirectory.newLayout.logo),
        callouts: {
          options: (resourceDirectory.newLayout.callouts?.options ?? []).map(
            (callout) => ({
              title: callout.title ?? undefined,
              description: callout.description ?? undefined,
              type: callout.type,
              customImg: getMediaUrl(callout.customImg),
              url: callout.url ?? undefined,
              urlTarget: callout.urlTarget ?? undefined,
            }),
          ),
          title: resourceDirectory.newLayout.callouts?.title ?? undefined,
        },
      }
    : undefined;

  const heroUrl =
    newLayout?.heroUrl ?? getMediaUrl(resourceDirectory.brand.hero);

  return {
    baseUrl,
    brand: {
      name: resourceDirectory.name,
      logoUrl: getMediaUrl(resourceDirectory.brand.logo),
      faviconUrl: getMediaUrl(resourceDirectory.brand.favicon),
      openGraphUrl: getMediaUrl(resourceDirectory.brand.openGraph),
      copyright: resourceDirectory.brand.copyright ?? undefined,
      theme: {
        borderRadius: resourceDirectory.brand.theme.borderRadius ?? undefined,
        primaryColor: resourceDirectory.brand.theme.primaryColor ?? undefined,
        secondaryColor:
          resourceDirectory.brand.theme.secondaryColor ?? undefined,
      },
    },
    contact: {
      number: resourceDirectory.brand.phoneNumber ?? undefined,
      feedbackUrl: resourceDirectory.brand.feedbackUrl ?? undefined,
    },
    customBasePath: process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '',
    errorTranslationData: {
      errorNamespaces,
      resources,
      locale,
    },
    featureFlags: {
      hideCategoriesHeading:
        resourceDirectory.featureFlags?.hideCategoriesHeading ?? false,
      hideDataProvidersHeading:
        resourceDirectory.featureFlags?.hideDataProvidersHeading ?? false,
      requireUserLocation:
        resourceDirectory.featureFlags?.requireUserLocation ?? false,
      showHomePageTour:
        resourceDirectory.featureFlags?.showHomePageTour ?? false,
      showPrintButton: resourceDirectory.featureFlags?.showPrintButton ?? false,
      showResourceAttribution:
        resourceDirectory.featureFlags?.showResourceAttribution ?? false,
      showResourceCategories:
        resourceDirectory.featureFlags?.showResourceCategories ?? false,
      showResourceLastAssuredDate:
        resourceDirectory.featureFlags?.showResourceLastAssuredDate ?? false,
      showSearchAndResourceServiceName:
        resourceDirectory.featureFlags?.showSearchAndResourceServiceName ??
        false,
      showSuggestionListTaxonomyBadge:
        resourceDirectory.featureFlags?.showSuggestionListTaxonomyBadge ??
        false,
      showUseMyLocationButtonOnDesktop:
        resourceDirectory.featureFlags?.showUseMyLocationButtonOnDesktop ??
        false,
      turnResourceCardTaxonomiesIntoLinks:
        resourceDirectory.featureFlags?.turnResourceCardTaxonomiesIntoLinks ??
        true,
      useHybridSemanticSearch:
        resourceDirectory.featureFlags?.useHybridSemanticSearch ?? false,
    },
    gtmContainerId:
      getTenant(resourceDirectory)?.common?.gtmContainerId ?? undefined,
    footer: {
      customMenu: resourceDirectory.footer?.customMenu ?? [],
      disclaimer: resourceDirectory.footer?.disclaimer ?? undefined,
    },
    header: {
      customMenu: resourceDirectory.header?.customMenu ?? [],
      customHomeUrl: resourceDirectory.header?.customHomeUrl ?? undefined,
      safeExit: resourceDirectory.header?.safeExit
        ? {
            enabled: resourceDirectory.header.safeExit.enabled ?? false,
            text: resourceDirectory.header.safeExit.text ?? undefined,
            url: resourceDirectory.header.safeExit.url ?? undefined,
          }
        : undefined,
      searchUrl: resourceDirectory.header?.searchUrl ?? undefined,
    },
    i18n,
    matomoContainerUrl:
      getTenant(resourceDirectory)?.common?.matomoContainerUrl ?? undefined,
    meta: {
      description: resourceDirectory.brand.meta?.description ?? '',
      title: resourceDirectory.brand.meta?.title ?? '',
    },
    pages: {
      privacyPolicyPage: {
        content: resourceDirectory.privacyPolicyPage?.content ?? undefined,
        enabled: resourceDirectory.privacyPolicyPage?.enabled ?? true,
        title: resourceDirectory.privacyPolicyPage?.title ?? undefined,
      },
      termsOfUsePage: {
        content: resourceDirectory.termsOfUsePage?.content ?? undefined,
        enabled: resourceDirectory.termsOfUsePage?.enabled ?? false,
        title: resourceDirectory.termsOfUsePage?.title ?? undefined,
      },
    },
    resource: {
      lastAssuredText: resourceDirectory.resource?.lastAssuredText ?? undefined,
    },
    search: {
      map,
      radiusOptions:
        resourceDirectory.search.searchSettings.radiusSelectValues ?? [],
      defaultRadius:
        resourceDirectory.search.searchSettings.defaultRadius ?? undefined,
      resultsLimit: resourceDirectory.search.searchSettings.resultsLimit ?? 25,
      texts: {
        locationInputPlaceholder:
          resourceDirectory.search.texts?.locationInputPlaceholder ?? undefined,
        noResultsFallbackText:
          resourceDirectory.search.texts?.noResultsFallbackText ?? undefined,
        queryInputPlaceholder:
          resourceDirectory.search.texts?.queryInputPlaceholder ?? undefined,
        title: resourceDirectory.search.texts?.title ?? undefined,
      },
    },
    suggestions:
      resourceDirectory.suggestions?.map((suggestion) => ({
        value: suggestion.value,
        taxonomies: suggestion.taxonomies,
      })) || [],
    tenantId: getTenantId(resourceDirectory),
    topics: {
      backText: resourceDirectory.topics?.backText ?? undefined,
      customHeading: resourceDirectory.topics?.customHeading ?? undefined,
      iconSize: resourceDirectory.topics?.iconSize ?? 'small',
      imageBorderRadius:
        resourceDirectory.topics?.imageBorderRadius ?? undefined,
      list: (resourceDirectory.topics?.list ?? []).map(
        ({ name, href, id, image, subtopics, target }) => ({
          name,
          href: href ?? undefined,
          id: id ?? undefined,
          image: getMediaUrl(image),
          subtopics:
            subtopics?.map(({ name, query, queryType, href, target }) => ({
              name,
              query: query ?? undefined,
              queryType: queryType ?? undefined,
              href: href ?? undefined,
              target: target ?? undefined,
            })) || [],
          target: target ?? undefined,
        }),
      ),
    },
    alert: resourceDirectory.common?.alert?.[0]
      ? {
          text: resourceDirectory.common.alert[0].text,
          buttonText: resourceDirectory.common.alert[0].buttonText ?? undefined,
          url: resourceDirectory.common.alert[0].url ?? undefined,
          variant: resourceDirectory.common.alert[0].variant ?? undefined,
        }
      : undefined,
    heroUrl,
    newLayout,
    providers: resourceDirectory.common?.dataProviders?.map((provider) => ({
      href: provider.url ?? undefined,
      logo: getMediaUrl(provider.logo),
      name: provider.name || undefined,
    })),
    providersCustomHeading:
      resourceDirectory.common?.customDataProvidersHeading ?? undefined,
    smsProvider: resourceDirectory.common?.smsProvider ?? undefined,
  };
}
export const getAppConfig = cache(getAppConfigBase);

export const getAppConfigWithoutHost = cache(async (locale: string) => {
  const { host } = await getHost();
  return getAppConfig(host, locale);
});
