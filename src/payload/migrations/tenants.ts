import { Payload, TypedLocale } from 'payload';
import {
  ImageUploadData,
  StrapiTenant,
  BrandAssets,
  SuggestionData,
  StrapiAppConfig,
  StrapiSuggestion,
  StrapiCategory,
  CategoryData,
  newLayoutAssets,
  StrapiDataProvider,
} from './types';
import { ResourceDirectory, Tenant, TenantMedia } from '../payload-types';
import { findResourceDirectoryByTenantId } from '../collections/ResourceDirectories/actions';
import { upsert } from './upsert';
import { defaultLocale } from '../i18n/locales';
import qs from 'qs';

export async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${url}`, {
      cause: error,
    });
  }
}

async function uploadImage(
  payload: Payload,
  imageData: ImageUploadData,
  context: {
    tenant: Tenant;
    locale?: string;
    resource?: string;
  },
): Promise<TenantMedia> {
  const {
    tenant: { id: tenantId, name: tenantName },
    locale,
    resource,
  } = context;

  const data = await fetch(imageData.url);
  if (!data.ok) {
    throw new Error(
      `Seed: Failed to fetch image from ${imageData.url} for tenant ${tenantName} (${tenantId})${locale ? `, locale ${locale}` : ''}${resource ? `, resource ${resource}` : ''}: ${data.statusText}`,
    );
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  try {
    return await payload.create({
      collection: 'tenant-media',
      data: {
        tenant: context.tenant,
      },
      file: {
        data: buffer,
        mimetype: imageData.mime,
        name: imageData.name,
        size: buffer.length,
      },
    });
  } catch (error) {
    throw new Error(
      `Seed: Failed to upload image ${imageData.name} from ${imageData.url} for tenant ${tenantName} (${tenantId})${locale ? `, locale ${locale}` : ''}${resource ? `, resource ${resource}` : ''}`,
      { cause: error },
    );
  }
}

async function uploadBrandAssets(
  payload: Payload,
  appConfig: StrapiAppConfig['attributes'],
  context: { tenant: Tenant; locale: string },
): Promise<BrandAssets> {
  const [logo, favicon, hero, openGraph] = await Promise.all([
    uploadImage(payload, appConfig.logo.data.attributes, {
      ...context,
      resource: 'logo',
    }),
    uploadImage(payload, appConfig.favicon.data.attributes, {
      ...context,
      resource: 'favicon',
    }),
    uploadImage(payload, appConfig.hero.data.attributes, {
      ...context,
      resource: 'hero',
    }),
    uploadImage(payload, appConfig.openGraph.data.attributes, {
      ...context,
      resource: 'openGraph',
    }),
  ]);

  return { logo, favicon, hero, openGraph };
}

async function uploadNewLayoutAssets(
  payload: Payload,
  appConfig: any,
  context: { tenant: Tenant; locale: string },
): Promise<newLayoutAssets> {
  const [logo, hero] = await Promise.all([
    appConfig.newLayout?.logo
      ? uploadImage(payload, appConfig.newLayout.logo.data.attributes, {
          ...context,
          resource: 'newLayout.logo',
        })
      : undefined,
    appConfig.newLayout?.hero
      ? uploadImage(payload, appConfig.newLayout.hero.data.attributes, {
          ...context,
          resource: 'newLayout.hero',
        })
      : undefined,
  ]);

  return { logo, hero };
}

async function fetchAppConfig(
  appConfigId: StrapiAppConfig['id'],
  locale: string,
) {
  const query = qs.stringify({
    populate: [
      'logo',
      'favicon',
      'hero',
      'openGraph',
      'copyright',
      'theme',
      'alert',
      'pages',
      'search',
      'plugins',
      'featureFlags',
      'lastAssuredText',
      'categoriesText',
      'hideAttribution',
      'hideCategoriesHeading',
      'customCategoriesHeading',
      'hideDataProvidersHeading',
      'customDataProvidersHeading',
      'headerMenu',
      'footerMenu',
      'map',
      'homePage',
      'resourcePage',
      'privacyPolicyPage',
      'termsOfUsePage',
      'dataProviders',
      'dataProviders.logo',
      'radiusSelectValues',
      'sms',
      'safeExit',
      'header',
      'footer',
      'newLayout',
      'newLayout.logo',
      'newLayout.hero',
      'topicsPage',
      'topics',
      'newLayoutCallouts',
      'newLayoutCallouts.options',
      'newLayoutCallouts.options.customImg',
      'localizations',
      'localizations.pages',
      'localizations.search',
      'localizations.lastAssuredText',
      'localizations.categoriesText',
      'localizations.homePage',
      'localizations.resourcePage',
      'localizations.privacyPolicyPage',
      'localizations.termsOfUsePage',
      'localizations.safeExit',
      'localizations.header',
      'localizations.footer',
      'localizations.topicsPage',
      'localizations.newLayoutCallouts',
      'localizations.newLayoutCallouts.options',
      'localizations.newLayoutCallouts.options.customImg',
    ],
  });

  const url = `${process.env.STRAPI_URL}/api/app-configs/${appConfigId}?locale=${locale}&${query}`;
  try {
    const { data } = await fetchJson(url);
    return data.attributes;
  } catch (error) {
    throw new Error(
      `Failed to fetch app config ${appConfigId} for locale ${locale}`,
      { cause: error },
    );
  }
}

async function findExistingResourceDirectory(tenantId: string) {
  try {
    return await findResourceDirectoryByTenantId(tenantId);
  } catch (error) {
    throw new Error(
      `Failed to find resource directory for tenantId ${tenantId}`,
      { cause: error },
    );
  }
}

export function createSuggestionItems(
  suggestions?: SuggestionData,
): ResourceDirectory['suggestions'] {
  return (
    suggestions?.list.map(({ displayName, taxonomies }) => ({
      value: displayName,
      taxonomies,
    })) ?? []
  );
}

export async function createDataProvidersItems(
  payload: Payload,
  tenant: Tenant,
  locale: TypedLocale,
  dataProviders: StrapiDataProvider[],
  existingDirectory: ResourceDirectory | null,
): Promise<NonNullable<ResourceDirectory['common']>['dataProviders']> {
  const result = await Promise.all(
    dataProviders.map(async (provider, idx) => {
      let logo: TenantMedia | number | null | undefined;
      if (provider.logo?.data?.attributes) {
        logo = await uploadImage(payload, provider.logo.data.attributes, {
          tenant,
          locale,
        });
      } else {
        logo = existingDirectory?.common?.dataProviders?.[idx]?.logo;
      }

      return {
        name: provider.name,
        url: provider.url,
        logo,
      };
    }),
  );
  return result as NonNullable<ResourceDirectory['common']>['dataProviders'];
}

export async function createTopicsItems(
  payload: Payload,
  tenant: Tenant,
  locale: TypedLocale,
  existingDirectory: ResourceDirectory | null,
  topics?: CategoryData,
): Promise<NonNullable<ResourceDirectory['topics']>['list']> {
  const result = await Promise.all(
    topics?.list.map(async (topic, idx) => {
      let image: TenantMedia | number | undefined | null;
      if (topic.image?.data?.attributes) {
        image = await uploadImage(payload, topic.image.data.attributes, {
          tenant,
          locale,
        });
      } else {
        image = existingDirectory?.topics?.list?.[idx]?.image;
      }

      return {
        name: topic.name,
        image,
        href: topic.href,
        subtopics: topic.subcategories.map((subcat) => ({
          name: subcat.name,
          href: subcat.href,
          query: subcat.query,
          queryType: subcat.queryType || (subcat.href ? 'link' : 'text'),
        })),
      };
    }) ?? [],
  );
  return result as NonNullable<ResourceDirectory['topics']>['list'];
}

async function createNewLayoutCalloutsItems(
  payload: Payload,
  tenant: Tenant,
  locale: TypedLocale,
  callouts: any[],
  existingDirectory: ResourceDirectory | null,
): Promise<
  NonNullable<
    NonNullable<ResourceDirectory['newLayout']>['callouts']
  >['options']
> {
  const result = await Promise.all(
    callouts.map(async (callout, idx) => {
      let customImg: TenantMedia | number | undefined | null;
      if (callout.customImg?.data?.attributes) {
        customImg = await uploadImage(
          payload,
          callout.customImg.data.attributes,
          {
            tenant,
            locale,
          },
        );
      } else {
        customImg = existingDirectory?.newLayout?.callouts?.[idx]?.customImg;
      }
      return {
        type: callout.type,
        customImg,
        description: callout.description,
        title: callout.title,
        url: callout.url,
      };
    }),
  );
  return result;
}

async function createResourceDirectory(
  payload: Payload,
  tenant: Tenant,
  locale: TypedLocale,
  appConfigId: StrapiAppConfig['id'],
  suggestions?: SuggestionData,
  topics?: CategoryData,
  facets?: Array<{ name: string; facet: string }>,
): Promise<ResourceDirectory> {
  const id = tenant.id;
  const populatedAppConfig = await fetchAppConfig(appConfigId, locale);
  const existingDirectory = await findExistingResourceDirectory(id);

  const baseData = {
    id,
    tenant,
    name: populatedAppConfig.brandName,
    brand: {
      copyright: populatedAppConfig.copyright,
      feedbackUrl: populatedAppConfig.feedbackUrl,
      phoneNumber: populatedAppConfig.phoneNumber,
      theme: {
        primaryColor: populatedAppConfig.theme.primaryColor,
        secondaryColor: populatedAppConfig.theme.secondaryColor,
        borderRadius: populatedAppConfig.theme.borderRadius,
      },
      meta: {
        title: populatedAppConfig?.homePage?.title || null,
        description: populatedAppConfig?.homePage?.description || null,
      },
    },
    common: {
      alert: populatedAppConfig.alert
        ? [
            {
              text: populatedAppConfig.alert.text,
              buttonText: populatedAppConfig.alert.buttonText,
              url: populatedAppConfig.alert.url,
              variant: populatedAppConfig.alert.variant,
            },
          ]
        : [],
      customDataProvidersHeading: populatedAppConfig.customDataProvidersHeading,
      dataProviders: await createDataProvidersItems(
        payload,
        tenant,
        locale,
        populatedAppConfig.dataProviders,
        existingDirectory,
      ),
      smsProvider: populatedAppConfig.sms?.provider,
    },
    featureFlags: {
      hideCategoriesHeading: populatedAppConfig.hideCategoriesHeading,
      hideDataProvidersHeading: populatedAppConfig.hideDataProvidersHeading,
      requireUserLocation: populatedAppConfig.featureFlags.requireUserLocation,
      showHomePageTour: populatedAppConfig.featureFlags.showHomePageTour,
      showPrintButton: populatedAppConfig.featureFlags.showPrintButton,
      showResourceAttribution:
        populatedAppConfig.featureFlags.showResourceAttribution,
      showResourceCategories:
        populatedAppConfig.featureFlags.showResourceCategories,
      showResourceLastAssuredDate:
        populatedAppConfig.featureFlags.showResourceLastAssuredDate,
      showSearchAndResourceServiceName:
        populatedAppConfig.featureFlags.showSearchAndResourceServiceName,
      showSuggestionListTaxonomyBadge:
        populatedAppConfig.featureFlags.showSuggestionListTaxonomyBadge,
      showUseMyLocationButtonOnDesktop:
        populatedAppConfig.featureFlags.showUseMyLocationButtonOnDesktop,
    },
    footer: {
      customMenu: populatedAppConfig.footerMenu ?? [],
      disclaimer: populatedAppConfig.footer?.disclaimer || null,
    },
    header: {
      customMenu: populatedAppConfig.headerMenu ?? [],
      customHomeUrl: populatedAppConfig.header?.customHomeUrl || null,
      safeExit: populatedAppConfig.safeExit ?? {},
      searchUrl: populatedAppConfig.header?.searchUrl || null,
    },
    newLayout: {
      enabled: populatedAppConfig.newLayout?.enabled || false,
      headerEnd: populatedAppConfig.newLayout?.headerEnd || '',
      headerStart: populatedAppConfig.newLayout?.headerStart || '',
      callouts: {
        options: await createNewLayoutCalloutsItems(
          payload,
          tenant,
          locale,
          populatedAppConfig.newLayoutCallouts?.options ?? [],
          existingDirectory,
        ),
        title: populatedAppConfig.newLayoutCallouts?.title || null,
      },
    },
    privacyPolicyPage: {
      content: populatedAppConfig.privacyPolicyPage?.content || null,
      enabled: populatedAppConfig.privacyPolicyPage?.enabled || true,
      title: populatedAppConfig.privacyPolicyPage?.title || 'Privacy Policy',
    },
    suggestions: createSuggestionItems(suggestions),
    termsOfUsePage: {
      content: populatedAppConfig.privacyPolicyPage?.content || null,
      enabled: populatedAppConfig.privacyPolicyPage?.enabled || false,
      title: populatedAppConfig.privacyPolicyPage?.title || 'Terms of Use',
    },
    topics: {
      backText: populatedAppConfig.topicsPage?.backText,
      customHeading: populatedAppConfig.customCategoriesHeading,
      iconSize: populatedAppConfig.topics?.iconSize,
      list: await createTopicsItems(
        payload,
        tenant,
        locale,
        existingDirectory,
        topics,
      ),
    },
    resource: {
      lastAssuredText: populatedAppConfig.lastAssuredText || null,
    },
    search: {
      map: populatedAppConfig.map && {
        center: JSON.stringify(populatedAppConfig.map.center),
        zoom: populatedAppConfig.map.zoom,
      },
      searchSettings: {
        resultsLimit:
          (populatedAppConfig.search?.resultsLimit ?? 0) > 25
            ? populatedAppConfig.search?.resultsLimit
            : 25,
        defaultRadius: populatedAppConfig.defaultRadiusValue,
        radiusSelectValues: populatedAppConfig.radiusSelectValues,
      },
      texts: {
        title: populatedAppConfig.search?.homePageTitle,
        queryInputPlaceholder: populatedAppConfig.search?.queryInputPlaceholder,
        locationInputPlaceholder:
          populatedAppConfig.search?.locationInputPlaceholder,
        noResultsFallbackText: populatedAppConfig.search?.noResultsFallbackText,
      },
    },
  };

  if (!existingDirectory) {
    try {
      const brandAssets = await uploadBrandAssets(payload, populatedAppConfig, {
        tenant,
        locale,
      });
      const newLayoutAssets = await uploadNewLayoutAssets(
        payload,
        populatedAppConfig,
        {
          tenant,
          locale,
        },
      );

      const createData = {
        ...baseData,
        brand: { ...baseData.brand, ...brandAssets },
        newLayout: {
          ...baseData.newLayout,
          ...newLayoutAssets,
        },
        search: {
          ...baseData.search,
          facets,
        },
      };

      const res = await payload.create({
        collection: 'resource-directories',
        locale,
        data: createData,
      });

      return res;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Seed: Failed to create resource directory for tenant ${tenant.name} (${id}), locale ${locale}`,
        { cause: error },
      );
    }
  }

  try {
    const updatedFacets = (existingDirectory.search.facets ?? []).map(
      (facet) => {
        const newFacet = facets?.find((f) => f.facet === facet.facet);
        return newFacet ? { ...facet, name: newFacet.name } : facet;
      },
    );
    return await payload.update({
      collection: 'resource-directories',
      id: existingDirectory.id,
      locale,
      data: {
        ...baseData,
        search: { ...baseData.search, facets: updatedFacets },
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error(
      `Seed: Failed to update resource directory for tenant ${tenant.name} (${id}), locale ${locale}`,
      { cause: error },
    );
  }
}

export function createTrustedDomains(trustedDomains: Array<{ url: string }>) {
  return trustedDomains.map(({ url }) => ({
    domain: url,
  }));
}

async function createTenant(
  payload: Payload,
  attributes: StrapiTenant['attributes'],
  locales: TypedLocale[],
  defaultLocale: TypedLocale,
  trustedDomains: { domain: string }[],
): Promise<Tenant> {
  const { name, tenantId: id, keycloakRealmId: realmId } = attributes;

  try {
    return await upsert(
      payload,
      'tenants',
      { id: { equals: id } },
      {
        id,
        name,
        enabledLocales: locales,
        defaultLocale,
        trustedDomains,
        auth: { realmId },
      },
    );
  } catch (error) {
    throw new Error(`Failed to upsert tenant ${name} (${id})`, {
      cause: error,
    });
  }
}

async function processResourceDirectories(
  payload: Payload,
  tenant: Tenant,
  appConfigIds: Record<string, StrapiAppConfig['id']>,
  suggestions: Record<string, SuggestionData>,
  topics: Record<string, CategoryData>,
  facets: Record<string, Array<{ name: string; facet: string }>>,
) {
  for (const [locale, appConfigId] of Object.entries(appConfigIds)) {
    console.log(
      `Seed: Adding resource directory for tenant ${tenant.name} (${tenant.id}) in locale ${locale}`,
    );
    try {
      await createResourceDirectory(
        payload,
        tenant,
        locale as TypedLocale,
        appConfigId,
        suggestions[locale],
        topics[locale],
        facets[locale],
      );
    } catch (error) {
      throw new Error(
        `Failed to process resource directory for tenant ${tenant.name} (${tenant.id}) in locale ${locale}`,
        { cause: error },
      );
    }
  }
}

function createSuggestionsMap(suggestion: { data: StrapiSuggestion | null }) {
  if (!suggestion.data) {
    return {};
  }

  const base = suggestion.data.attributes;
  const localizationMap: Record<string, SuggestionData> = {};

  base.localizations.data.forEach((entry) => {
    localizationMap[entry.attributes.locale] = entry.attributes;
  });

  return {
    en: base,
    ...localizationMap,
  };
}

function createTopicsMap(category: { data: StrapiCategory | null }) {
  if (!category.data) {
    return {};
  }

  const base = category.data.attributes;
  const localizationMap: Record<string, CategoryData> = {};

  base.localizations.data.forEach((entry) => {
    localizationMap[entry.attributes.locale] = entry.attributes;
  });

  return {
    en: base,
    ...localizationMap,
  };
}

function createAppConfigIdsMap(appConfig: {
  data: StrapiAppConfig;
}): Record<string, StrapiAppConfig['id']> {
  const base = appConfig.data;
  const localizationMap: Record<string, StrapiAppConfig['id']> = {};

  const locales =
    base.attributes.nextConfig?.i18n?.locales ||
    base.attributes.localizations.data.map((loc) => loc.attributes.locale);

  locales.forEach((locale) => {
    const entryId = base.attributes.localizations.data.find(
      (loc) => loc.attributes.locale === locale,
    )?.id;

    if (entryId) {
      localizationMap[locale] = entryId;
    }
  });

  return {
    en: base.id,
    ...localizationMap,
  };
}

function createFacetsMap(
  baseFacets: { name: string; facet: string }[],
  localizations: Array<{
    attributes: { locale: string; facets: { name: string; facet: string }[] };
  }>,
): Record<string, Array<{ name: string; facet: string }>> {
  const facetsMap: Record<string, Array<{ name: string; facet: string }>> = {
    en: baseFacets,
  };

  localizations.forEach((loc) => {
    facetsMap[loc.attributes.locale] = loc.attributes.facets;
  });

  return facetsMap;
}

async function processTenant(
  payload: Payload,
  strapiTenant: StrapiTenant,
): Promise<void> {
  const { attributes } = strapiTenant;
  const {
    name,
    tenantId: id,
    trustedDomains: rawTrustedDomains,
    app_config,
  } = attributes;

  const trustedDomains = createTrustedDomains(rawTrustedDomains);

  console.log(`Seed: Processing tenant ${name} (${id})`);

  const hasAppConfig = Boolean(attributes.app_config.data);

  const defaultLocaleForTenant =
    app_config.data.attributes.nextConfig?.i18n.defaultLocale || defaultLocale;

  const locales = hasAppConfig
    ? Object.keys(createAppConfigIdsMap(attributes.app_config))
    : [defaultLocaleForTenant];

  let tenant;
  try {
    tenant = await createTenant(
      payload,
      attributes,
      locales as TypedLocale[],
      defaultLocale,
      trustedDomains,
    );
  } catch (error) {
    throw new Error(`Failed to create tenant ${name} (${id})`, {
      cause: error,
    });
  }

  if (hasAppConfig) {
    console.log(
      `Seed: Found app_config for tenant ${name} (${id}). Creating resource directory.`,
    );
    let suggestions, appConfigIds, topics, facets;
    try {
      suggestions = createSuggestionsMap(attributes.suggestion);
      appConfigIds = createAppConfigIdsMap(attributes.app_config);
      topics = createTopicsMap(attributes.category);
      facets = createFacetsMap(
        attributes.facets,
        attributes.localizations.data,
      );
    } catch (error) {
      // This should not happen due to hasAppConfig check, but for safety:
      throw new Error(
        `Failed to create suggestions or appConfigs map for tenant ${name} (${id})`,
        { cause: error },
      );
    }

    try {
      await processResourceDirectories(
        payload,
        tenant,
        appConfigIds,
        suggestions,
        topics,
        facets,
      );

      // Now update the tenant to enable the service
      await payload.update({
        collection: 'tenants',
        id: tenant.id,
        data: {
          services: {
            ...tenant.services,
            resourceDirectory: true,
          },
        },
      });
      console.log(
        `Seed: Enabled 'resourceDirectory' service for tenant ${name} (${id}).`,
      );
    } catch (error) {
      throw new Error(
        `Failed to process resource directories for tenant ${name} (${id})`,
        { cause: error },
      );
    }
  }
}

async function fetchTenants(): Promise<StrapiTenant[]> {
  const query = qs.stringify(
    {
      locale: 'en',
      populate: {
        trustedDomains: '*',
        localizations: {
          populate: 'facets',
        },
        facets: '*',
        app_config: {
          populate: ['localizations', 'nextConfig'],
        },
        suggestion: {
          populate: {
            list: '*',
            localizations: {
              populate: ['list'],
            },
          },
        },
        category: {
          populate: {
            list: {
              populate: ['image', 'subcategories'],
            },
            localizations: {
              populate: {
                list: {
                  populate: ['image', 'subcategories'],
                },
              },
            },
          },
        },
      },
      pagination: {
        pageSize: 100,
      },
    },
    { encodeValuesOnly: true },
  );

  const url = `${process.env.STRAPI_URL}/api/tenants?${query}`;

  try {
    const { data } = await fetchJson(url);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch tenants from Strapi`, {
      cause: error,
    });
  }
}

export async function addTenants(
  payload: Payload,
  requestedTenants?: string[],
): Promise<void> {
  let tenants;
  try {
    tenants = await fetchTenants();
    console.log(`Seed: Found ${tenants.length} tenants`);
  } catch (error) {
    throw new Error(`Failed to fetch tenants`, {
      cause: error,
    });
  }

  const validTetantsNames = requestedTenants || [
    'Illinois 211',
    'Nebraska 211',
    'Minnesota Aging and Disability Resources',
    'Washington 211',
    '988 Maryland',
  ];

  const validTenants = tenants.filter((tenant) =>
    validTetantsNames.includes(tenant.attributes.name),
  );

  const processValidTenant = (tenant: StrapiTenant) =>
    processTenant(payload, tenant);

  try {
    await Promise.all(validTenants.map(processValidTenant));
  } catch (error) {
    throw new Error(`Failed to process one or more tenants`, {
      cause: error,
    });
  }
}
