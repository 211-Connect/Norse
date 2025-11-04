const qs = require('qs');
const path = require('path');
const fs = require('fs-extra');
const syncClient = require('sync-rest-client');
const _ = require('lodash');

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;

const query = qs.stringify({
  populate: {
    app_config: {
      populate: [
        'logo',
        'favicon',
        'hero',
        'openGraph',
        'copyright',
        'i18n',
        'i18n.locales',
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
        'localizations.logo',
        'localizations.favicon',
        'localizations.hero',
        'localizations.openGraph',
        'localizations.i18n',
        'localizations.i18n.locales',
        'localizations.theme',
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
    },
    category: {
      populate: [
        'list',
        'list.subcategories',
        'list.image',
        'image',
        'localizations',
        'localizations.list',
        'localizations.list.subcategories',
        'localizations.list.image',
        'localizations.image',
      ],
    },
    suggestion: {
      populate: ['list', 'localizations', 'localizations.list'],
    },
  },
});

/**
 * @param {string} dir Next.js root directory
 * @returns {*} void
 */
module.exports = function createFromStrapi(dir) {
  if (!STRAPI_URL || !STRAPI_TOKEN || !TENANT_ID) return;

  try {
    const res = syncClient.get(
      `${STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${TENANT_ID}&${query}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      },
    );

    const data = res.body.data;
    const tenant = data[0].attributes;
    const categories = tenant.category.data.attributes.list;
    const categoryTranslations =
      tenant.category.data.attributes.localizations.data;
    const suggestions = tenant.suggestion.data.attributes.list;
    const suggestionTranslations =
      tenant.suggestion.data.attributes.localizations.data;
    const appConfig = tenant.app_config.data.attributes;
    const appConfigTranslations = appConfig.localizations.data;
    const logoUrl = appConfig.logo.data.attributes.url;
    const faviconUrl = appConfig.favicon.data.attributes.url;
    const heroUrl = appConfig.hero.data.attributes.url;
    const openGraphUrl = appConfig.openGraph.data.attributes.url;

    const newLayoutLogoUrl = appConfig?.newLayout?.logo?.data?.attributes?.url;
    const newLayoutHeroUrl = appConfig?.newLayout?.hero?.data?.attributes?.url;
    const newLayout = appConfig?.newLayout && {
      enabled: appConfig.newLayout.enabled,
      headerStart: appConfig.newLayout.headerStart,
      headerEnd: appConfig.newLayout.headerEnd,
      logoUrl: newLayoutLogoUrl,
      heroUrl: newLayoutHeroUrl,
    };

    const translationFile = {
      en: {},
    };

    const newLayoutCallouts = appConfig?.newLayoutCallouts && {
      title: appConfig.newLayoutCallouts.title,
      options:
        appConfig.newLayoutCallouts.options?.map((option) => ({
          ...option,
          customImg: option.customImg?.data?.attributes?.url ?? null,
        })) ?? [],
    };

    const newAppConfig = {
      nextConfig: appConfig.nextConfig,
      brand: {
        name: appConfig.brandName,
        logoUrl: logoUrl,
        faviconUrl: faviconUrl,
        openGraphUrl: openGraphUrl,
        copyright: appConfig?.copyright,
      },
      contact: {
        email: appConfig.email,
        number: appConfig.phoneNumber,
        feedbackUrl: appConfig.feedbackUrl,
      },
      search: {
        defaultRadius: appConfig?.defaultRadiusValue ?? 0,
        defaultRadius: appConfig?.defaultRadiusValue ?? 0,
        radiusOptions: appConfig?.radiusSelectValues ?? null,
        resultsLimit: appConfig?.search?.resultsLimit ?? 25,
      },
      adapters: {
        geocoder: appConfig?.adapters?.geocoder ?? 'mapbox',
        map: appConfig?.adapters?.map ?? 'maplibre',
      },
      map: appConfig?.map ?? {
        center: [39.8283459, -98.5794797], // Center of USA
        zoom: 7,
      },
      alert: appConfig?.alert,
      theme: appConfig?.theme,
      hideAttribution: appConfig?.hideAttribution ?? true,
      hideCategoriesHeading: appConfig?.hideCategoriesHeading ?? false,
      hideDataProvidersHeading: appConfig?.hideDataProvidersHeading ?? false,
      pages: {},
      menus: {
        header: [],
        footer: [],
      },
      providers: [],
      i18n: {
        defaultLocale: appConfig?.i18n?.defaultLocale ?? 'en',
        locales: appConfig?.i18n?.locales?.map((el) => el.value) ?? ['en'],
      },
      categories: [],
      suggestions: [],
      sms: appConfig?.sms,
      newLayout,
      topicsConfig: appConfig?.topics,
      translatedConfig: {
        en: {
          newLayoutCallouts,
          safeExit: appConfig?.safeExit,
          header: appConfig?.header,
          footer: appConfig?.footer,
        },
      },
    };

    const translations = {
      'search.hero_title': appConfig.search.homePageTitle,
      'search.query_placeholder': appConfig.search.queryInputPlaceholder,
      'search.location_placeholder': appConfig.search.locationInputPlaceholder,
      'search.no_results_fallback_text':
        appConfig?.search?.noResultsFallbackText,
      last_assured_text: appConfig?.resourcePage?.lastAssuredText,
      categories_text: appConfig?.resourcePage?.categoriesText,
      meta_title: appConfig?.homePage?.title,
      meta_description: appConfig?.homePage?.description,
      'privacy_policy.title':
        appConfig?.privacyPolicyPage?.title ?? 'Privacy Policy',
      'privacy_policy.content': appConfig?.privacyPolicyPage?.content,
      'terms_of_use.title': appConfig?.termsOfUsePage?.title ?? 'Terms of Use',
      'terms_of_use.content': appConfig?.termsOfUsePage?.content,
      'topics_page.backText': appConfig?.topicsPage?.backText,
    };

    if (appConfig?.customCategoriesHeading) {
      translations['search.categories_heading'] =
        appConfig.customCategoriesHeading;
    }
    if (appConfig?.customDataProvidersHeading) {
      translations['search.data_providers_heading'] =
        appConfig.customDataProvidersHeading;
    }

    translationFile['en'] = translations;

    newAppConfig.pages['home'] = {
      heroSection: {
        backgroundImageUrl: heroUrl,
      },
    };
    newAppConfig.pages['privacyPolicy'] = {
      enabled: appConfig?.privacyPolicyPage?.enabled ?? true,
    };
    newAppConfig.pages['termsOfUse'] = {
      enabled: appConfig?.termsOfUsePage?.enabled ?? false,
    };

    for (const menu of appConfig?.headerMenu ?? []) {
      newAppConfig.menus.header.push({
        name: menu.name,
        href: menu.href,
        target: menu?.target ?? '_self',
      });
    }

    for (const menu of appConfig?.footerMenu ?? []) {
      newAppConfig.menus.footer.push({
        name: menu.name,
        href: menu.href,
        target: menu?.target ?? '_self',
      });
    }

    for (const provider of appConfig?.dataProviders ?? []) {
      newAppConfig.providers.push({
        name: provider.name,
        href: provider.url,
        logo: provider?.logo?.data?.attributes?.url,
      });
    }

    for (const locale of appConfigTranslations || []) {
      const data = locale.attributes;

      const translations = {
        'search.hero_title': data?.search?.homePageTitle,
        'search.query_placeholder': data?.search?.queryInputPlaceholder,
        'search.location_placeholder': data?.search?.locationInputPlaceholder,
        'search.no_results_fallback_text': data?.search?.noResultsFallbackText,
        last_assured_text: data?.resourcePage?.lastAssuredText,
        categories_text: data?.resourcePage?.categoriesText,
        meta_title: data?.homePage?.title,
        meta_description: data?.homePage?.description,
        'privacy_policy.title': data?.privacyPolicyPage?.title,
        'privacy_policy.content': data?.privacyPolicyPage?.content,
        'terms_of_use.title': data?.termsOfUsePage?.title,
        'terms_of_use.content': data?.termsOfUsePage?.content,
        'topics_page.backText': data?.topicsPage?.backText,
      };

      if (data?.customCategoriesHeading) {
        translations['search.categories_heading'] =
          data.customCategoriesHeading;
      }
      if (data?.customDataProvidersHeading) {
        translations['search.data_providers_heading'] =
          data.customDataProvidersHeading;
      }

      translationFile[data.locale] = translations;
      const newLayoutCallouts = data?.newLayoutCallouts && {
        title: data.newLayoutCallouts.title,
        options:
          data.newLayoutCallouts.options?.map((option) => ({
            ...option,
            customImg: option.customImg?.data?.attributes?.url ?? null,
          })) ?? [],
      };

      newAppConfig.translatedConfig[data.locale] = {
        safeExit: data?.safeExit,
        header: data?.header,
        footer: data?.footer,
        newLayoutCallouts,
      };
    }

    const categoryFiles = {};
    for (const _category of categoryTranslations || []) {
      const category = _category.attributes;
      if (!(category.locale in categoryFiles)) {
        categoryFiles[category.locale] = [];
      }

      categoryFiles[category.locale] = categoryFiles[category.locale].concat(
        category.list.map((cat, idx) => {
          const matchingCategory = categories[idx];

          return {
            name: cat['name'],
            href: cat['href'],
            target: cat['target'] || '_self',
            image:
              matchingCategory?.['image']?.['data']?.['attributes']?.['url'],
            subcategories: cat['subcategories'].map((sub) => ({
              name: sub['name'],
              href: sub['href'],
              target: sub['target'] || '_self',
              query: sub['query'],
              queryType: sub['queryType'],
            })),
          };
        }),
      );
    }

    for (const _category of categories) {
      const category = _category;
      if (!('en' in categoryFiles)) {
        categoryFiles['en'] = [];
      }
      categoryFiles['en'] = categoryFiles['en'].concat([
        {
          name: category['name'],
          href: category['href'],
          target: category['target'] || '_self',
          image: category['image']?.['data']?.['attributes']?.['url'],
          subcategories: category['subcategories'].map((sub) => ({
            name: sub['name'],
            href: sub['href'],
            target: sub['target'] || '_self',
            query: sub['query'],
            queryType: sub['queryType'],
          })),
        },
      ]);
    }

    for (const key in categoryFiles) {
      const categoryToWrite = categoryFiles[key];
      fs.mkdirpSync(path.join(dir, `public/locales/${key}`));
      fs.writeFileSync(
        path.resolve(`public/locales/${key}/categories.json`),
        JSON.stringify(categoryToWrite, null, 2),
      );
    }

    const suggestionFiles = {};
    for (const _suggestion of suggestionTranslations || []) {
      const suggestion = _suggestion.attributes;
      if (!(suggestion.locale in suggestionFiles)) {
        suggestionFiles[suggestion.locale] = [];
      }

      suggestionFiles[suggestion.locale] = suggestionFiles[
        suggestion.locale
      ].concat(
        suggestion.list.map((sugg) => ({
          name: sugg['displayName'],
          taxonomies: sugg['taxonomies'],
        })),
      );
    }

    for (const _suggestion of suggestions || []) {
      const suggestion = _suggestion;
      if (!('en' in suggestionFiles)) {
        suggestionFiles['en'] = [];
      }

      suggestionFiles['en'] = suggestionFiles['en'].concat([
        {
          name: suggestion['displayName'],
          taxonomies: suggestion['taxonomies'],
        },
      ]);
    }

    for (const key in suggestionFiles) {
      const suggestionToWrite = suggestionFiles[key];
      fs.mkdirpSync(path.join(dir, `public/locales/${key}`));
      fs.writeFileSync(
        path.resolve(`public/locales/${key}/suggestions.json`),
        JSON.stringify(suggestionToWrite, null, 2),
      );
    }

    function deepCleanConfig(config) {
      if (Array.isArray(config)) {
        return config.map((item) => deepCleanConfig(item));
      } else if (_.isPlainObject(config)) {
        return _.chain(config)
          .omitBy(_.isNil)
          .omit('id')
          .mapValues((value) => deepCleanConfig(value))
          .value();
      } else {
        return config;
      }
    }

    const cleanedAppConfig = deepCleanConfig(newAppConfig);

    const featureFlags = _.omit(
      _.omitBy(appConfig.featureFlags, _.isNil),
      'id',
    );

    fs.writeFileSync(
      path.resolve('./.norse/flags.json'),
      JSON.stringify(featureFlags, null, 2),
    );

    fs.writeFileSync(
      path.join(dir, 'tmp/app.json'),
      JSON.stringify(cleanedAppConfig, null, 2),
    );

    for (const key in translationFile) {
      fs.mkdirpSync(path.join(dir, `public/locales/${key}`));
      fs.writeFileSync(
        path.join(dir, `public/locales/${key}/dynamic.json`),
        JSON.stringify(translationFile[key], null, 2),
      );
    }
  } catch (err) {
    console.log(err);
  }
};
