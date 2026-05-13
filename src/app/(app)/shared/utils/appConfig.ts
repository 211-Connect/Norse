import { cookies, headers } from 'next/headers';
import { TypedLocale } from 'payload';
import { cache } from 'react';

import { findResourceDirectoryByHost } from '@/payload/collections/ResourceDirectories/actions';
import { defaultLocale } from '@/payload/i18n/locales';
import {
  ResourceDirectory,
  Tenant,
  TenantMedia,
} from '@/payload/payload-types';
import { AppConfig } from '@/types/appConfig';

import { DEFAULT_RESOURCE_LAYOUT } from '../../features/resource/types/layout-config';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '../../features/search/types/card-layout-config';
import { SESSION_ID } from '../lib/constants';
import { DEFAULT_BADGE_COLOR } from '../theme/theme-config';
import { getHost } from './getHost';

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

  return resourceDirectory.tenant?.id;
}

function getTenantMainUmamiWebsiteId(
  resourceDirectory: ResourceDirectory,
): string | undefined {
  const websiteIds = getTenant(resourceDirectory)?.common?.umamiWebsiteIds;

  if (!Array.isArray(websiteIds) || websiteIds.length === 0) {
    return undefined;
  }

  return websiteIds[0]?.websiteId ?? undefined;
}

function getSmsConfig(resourceDirectory: ResourceDirectory): AppConfig['sms'] {
  const sms = getTenant(resourceDirectory)?.sms;

  if (!sms?.smsProvider) {
    return null;
  }

  if (sms.smsProvider === 'Twilio') {
    const twilio = sms.twilio;
    const hasTwilioConfig = Boolean(
      twilio?.phoneNumber &&
      twilio?.apiKey &&
      twilio?.apiKeySid &&
      twilio?.accountSid,
    );

    return hasTwilioConfig ? { provider: sms.smsProvider } : null;
  }

  const ems = sms.ems;
  const hasEmsConfig = Boolean(ems?.apiKey || ems?.shortCode || ems?.keyword);

  return hasEmsConfig ? { provider: sms.smsProvider } : null;
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

type CustomAttributeItem = {
  componentId: string;
  id?: string | null;
  customAttribute?: {
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
};

type LayoutColumnGroup = NonNullable<
  ResourceDirectory['resource']
>['leftColumn'];
type LayoutGroupItem = NonNullable<NonNullable<LayoutColumnGroup>[number]>;
type LayoutItem = NonNullable<NonNullable<LayoutGroupItem['items']>[number]>;

function mergeCustomAttribute<T extends CustomAttributeItem>(
  item: T,
  fallbackItem?: T,
): T {
  if (
    item.componentId !== 'customAttribute' ||
    !item.customAttribute ||
    !fallbackItem?.customAttribute
  ) {
    return item;
  }

  return {
    ...item,
    customAttribute: {
      ...item.customAttribute,
      title:
        item.customAttribute.title ||
        fallbackItem.customAttribute.title ||
        null,
      subtitle:
        item.customAttribute.subtitle ||
        fallbackItem.customAttribute.subtitle ||
        null,
      description:
        item.customAttribute.description ||
        fallbackItem.customAttribute.description ||
        null,
    },
  };
}

function findFallbackById<T extends { id?: string | null }>(
  current: T | undefined,
  fallbackItems: T[] | undefined,
): T | undefined {
  if (!current?.id || !fallbackItems?.length) {
    return undefined;
  }

  return fallbackItems.find((item) => item.id === current.id);
}

function applyCustomAttributeFallback(
  column: NonNullable<ResourceDirectory['resource']>['leftColumn'],
  fallbackColumn: NonNullable<ResourceDirectory['resource']>['leftColumn'],
): NonNullable<ResourceDirectory['resource']>['leftColumn'] {
  if (!column || !fallbackColumn) return column;

  return column.map((group, groupIndex) => {
    const fallbackGroup =
      findFallbackById<LayoutGroupItem>(group, fallbackColumn) ??
      fallbackColumn[groupIndex];
    if (!fallbackGroup || !group.items) return group;

    return {
      ...group,
      items: group.items.map((item, itemIndex) =>
        mergeCustomAttribute(
          item,
          findFallbackById<LayoutItem>(
            item,
            fallbackGroup.items ?? undefined,
          ) ?? fallbackGroup.items?.[itemIndex],
        ),
      ),
    };
  });
}

function applyCardLayoutCustomAttributeFallback(
  cardLayout: NonNullable<ResourceDirectory['search']['cardLayout']>,
  fallbackCardLayout?: NonNullable<
    ResourceDirectory['search']['cardLayout']
  > | null,
): NonNullable<ResourceDirectory['search']['cardLayout']> {
  if (!cardLayout || !fallbackCardLayout) {
    return DEFAULT_SEARCH_CARD_LAYOUT;
  }

  return cardLayout.map((item, itemIndex) =>
    mergeCustomAttribute(
      item,
      findFallbackById(item, fallbackCardLayout) ??
        fallbackCardLayout[itemIndex],
    ),
  );
}

async function getAppConfigBase(
  host: string,
  locale: string,
): Promise<AppConfig> {
  const resourceDirectory = await findResourceDirectoryByHost(
    host,
    locale as TypedLocale,
  );

  let map: AppConfig['search']['map'] = {
    center: [39.8283459, -98.5794797], // Center of USA
    zoom: 7,
  };

  if (!resourceDirectory) {
    return {
      accessibility: {
        fontSize: {
          allowedValues: ['1rem'],
        },
      },
      baseUrl: '',
      brand: {
        name: '',
        theme: {},
      },
      contact: {},
      sms: null,
      featureFlags: {
        anonymousCollectionsEnabled: true,
        requireUserLocation: false,
        showFeedbackButtonGlobal: false,
        showFeedbackButtonOnResourcePages: false,
        showHomePageTour: false,
        showPrintButton: false,
        showSearchAndResourceServiceName: false,
        showSuggestionListTaxonomyBadge: false,
        showUseMyLocationButtonOnDesktop: false,
        turnResourceCardTaxonomiesIntoLinks: true,
      },
      footer: {
        customMenu: [],
      },
      header: {
        customMenu: [],
        position: 'sticky',
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
        categoriesText: undefined,
        lastAssuredText: undefined,
        layout: {
          leftColumn: [],
          rightColumn: [],
        },
      },
      search: {
        facets: [],
        map,
        radiusOptions: [],
        hybridSemanticSearchEnabled: false,
        resultsLimit: 25,
      },
      sessionId: '',
      badges: [],
      suggestions: [],
      topics: {
        iconSize: 'small',
        list: [],
      },
    };
  }

  const i18n = getTenantI18n(resourceDirectory);

  // Fetch English resource directory for fallback if not English locale
  let englishResourceDirectory: ResourceDirectory | null = null;
  if (
    locale !== 'en' &&
    (resourceDirectory.resource?.useCustomLayout ||
      !resourceDirectory.search.cardLayout)
  ) {
    englishResourceDirectory = await findResourceDirectoryByHost(host, 'en');
  }

  const headerList = await headers();
  const cookiesList = await cookies();

  const baseUrl = `${headerList.get('x-forwarded-proto')}://${headerList.get('host')}`;
  const sessionId = cookiesList.get(SESSION_ID)?.value || '';

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
              urlTarget: callout.openInNewTab ? '_blank' : undefined,
            }),
          ),
          title: resourceDirectory.newLayout.callouts?.title ?? undefined,
        },
      }
    : undefined;

  const heroUrl =
    newLayout?.heroUrl ?? getMediaUrl(resourceDirectory.brand.hero);

  let a11yAllowedFontSizes: string[] = ['1rem'];
  if (resourceDirectory.accessibility?.fontSizeAdjustment) {
    a11yAllowedFontSizes.push(
      resourceDirectory.accessibility.fontSizeAdjustment,
    );
  }

  return {
    accessibility: {
      fontSize: {
        allowedValues: a11yAllowedFontSizes,
      },
    },
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
    sms: getSmsConfig(resourceDirectory),
    featureFlags: {
      anonymousCollectionsEnabled: true,
      requireUserLocation:
        resourceDirectory.featureFlags?.requireUserLocation ?? false,
      showFeedbackButtonGlobal:
        resourceDirectory.featureFlags?.showFeedbackButtonGlobal ?? false,
      showFeedbackButtonOnResourcePages:
        resourceDirectory.featureFlags?.showFeedbackButtonOnResourcePages ??
        false,
      showHomePageTour:
        resourceDirectory.featureFlags?.showHomePageTour ?? false,
      showPrintButton: resourceDirectory.featureFlags?.showPrintButton ?? false,
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
      favoritesButtonLabel:
        resourceDirectory.header?.favoritesButtonLabel ?? undefined,
      feedbackButtonLabel:
        resourceDirectory.header?.feedbackButtonLabel ?? undefined,
      safeExit: resourceDirectory.header?.safeExit
        ? {
            enabled: resourceDirectory.header.safeExit.enabled ?? false,
            text: resourceDirectory.header.safeExit.text ?? undefined,
            url: resourceDirectory.header.safeExit.url ?? undefined,
            target: resourceDirectory.header.safeExit.openInNewTab
              ? '_blank'
              : undefined,
          }
        : undefined,
      searchUrl: resourceDirectory.header?.searchUrl ?? undefined,
      position: resourceDirectory.header?.position ?? 'sticky',
    },
    i18n,
    matomoContainerUrl:
      getTenant(resourceDirectory)?.common?.matomoContainerUrl ?? undefined,
    umamiWebsiteId: getTenantMainUmamiWebsiteId(resourceDirectory),
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
      categoriesText: resourceDirectory.resource?.categoriesText ?? undefined,
      lastAssuredText: resourceDirectory.resource?.lastAssuredText ?? undefined,
      layout: resourceDirectory.resource?.useCustomLayout
        ? {
            leftColumn: applyCustomAttributeFallback(
              resourceDirectory.resource.leftColumn,
              englishResourceDirectory?.resource?.leftColumn,
            ),
            rightColumn: applyCustomAttributeFallback(
              resourceDirectory.resource.rightColumn,
              englishResourceDirectory?.resource?.rightColumn,
            ),
          }
        : DEFAULT_RESOURCE_LAYOUT,
    },
    search: {
      facets: (resourceDirectory.search.facets ?? [])
        .filter(({ name }) => name)
        .map(({ name, facet, showInDetails }) => ({
          name: name!,
          facet,
          showInDetails: Boolean(showInDetails ?? true),
        })),
      map,
      radiusOptions:
        resourceDirectory.search.searchSettings.radiusSelectValues ?? [],
      defaultRadius:
        resourceDirectory.search.searchSettings.defaultRadius ?? undefined,
      hybridSemanticSearchEnabled:
        resourceDirectory.search.searchSettings.hybridSemanticSearchEnabled ??
        false,
      resultsLimit: resourceDirectory.search.searchSettings.resultsLimit ?? 25,
      texts: {
        locationInputPlaceholder:
          resourceDirectory.search.texts?.locationInputPlaceholder ?? undefined,
        noResultsFallbackText:
          resourceDirectory.search.texts?.noResultsFallbackText ?? undefined,
        queryInputPlaceholder:
          resourceDirectory.search.texts?.queryInputPlaceholder ?? undefined,
        suggestionHeaders: {
          categories:
            resourceDirectory.search.texts?.suggestionHeaders?.categories ??
            undefined,
          suggestions:
            resourceDirectory.search.texts?.suggestionHeaders?.suggestions ??
            undefined,
          taxonomies:
            resourceDirectory.search.texts?.suggestionHeaders?.taxonomies ??
            undefined,
        },
        title: resourceDirectory.search.texts?.title ?? undefined,
        useTextLinkForViewDetails:
          resourceDirectory.search.texts?.useTextLinkForViewDetails ??
          undefined,
        viewDetailsText:
          resourceDirectory.search.texts?.viewDetailsText ?? undefined,
      },
      cardLayout:
        resourceDirectory.search.cardLayout &&
        resourceDirectory.search.useCustomCardLayout
          ? applyCardLayoutCustomAttributeFallback(
              resourceDirectory.search.cardLayout,
              locale === 'en'
                ? resourceDirectory.search.cardLayout
                : englishResourceDirectory?.search.cardLayout,
            )
          : DEFAULT_SEARCH_CARD_LAYOUT,
    },
    sessionId,
    badges:
      resourceDirectory.badges?.list
        ?.filter((badge) => badge.filter)
        ?.map((badge) => ({
          ...badge,
          style: badge.style || 'bold',
          color: badge.color || DEFAULT_BADGE_COLOR,
          icon: badge.icon,
        })) || [],
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
        ({ name, href, id, image, subtopics, openInNewTab }) => ({
          name,
          href: href ?? undefined,
          id: id ?? undefined,
          image: getMediaUrl(image),
          subtopics:
            subtopics?.map(
              ({ name, query, queryType, href, openInNewTab }) => ({
                name,
                query: queryType === 'link' ? undefined : (query ?? undefined),
                queryType: queryType ?? undefined,
                href: queryType === 'link' ? (href ?? undefined) : undefined,
                target: openInNewTab ? '_blank' : undefined,
              }),
            ) || [],
          target: openInNewTab ? '_blank' : undefined,
        }),
      ),
    },
    alert: resourceDirectory.common?.alert?.[0]
      ? {
          text: resourceDirectory.common.alert[0].text,
          buttonText: resourceDirectory.common.alert[0].buttonText ?? undefined,
          target: resourceDirectory.common.alert[0].openInNewTab
            ? '_blank'
            : undefined,
          url: resourceDirectory.common.alert[0].url ?? undefined,
          variant: resourceDirectory.common.alert[0].variant ?? undefined,
        }
      : undefined,
    heroUrl,
    highlights: resourceDirectory.highlights
      ? {
          sectionTitle: resourceDirectory.highlights.sectionTitle ?? undefined,
          enableCarouselAutoplay:
            resourceDirectory.highlights.enableCarouselAutoplay ?? false,
          autoplayInterval: resourceDirectory.highlights.autoplayInterval ?? 5,
          items: (resourceDirectory.highlights.items ?? []).map((item) => ({
            image: getMediaUrl(item.image),
            title: item.title,
            description: item.description ?? undefined,
            buttonText: item.buttonText ?? undefined,
            buttonUrl: item.buttonUrl ?? undefined,
            openInNewTab: item.openInNewTab ?? false,
          })),
        }
      : undefined,
    newLayout,
    providers: resourceDirectory.common?.dataProviders?.map((provider) => ({
      href: provider.url ?? undefined,
      logo: getMediaUrl(provider.logo),
      name: provider.name || undefined,
      target: provider.openInNewTab ? '_blank' : undefined,
    })),
    providersCustomHeading:
      resourceDirectory.common?.customDataProvidersHeading ?? undefined,
  };
}
export const getAppConfig = cache(getAppConfigBase);

export const getAppConfigWithoutHost = async (locale: string) => {
  const { host } = await getHost();
  return getAppConfig(host, locale);
};
