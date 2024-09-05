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
        'headerMenu',
        'footerMenu',
        'map',
        'dataProviders',
        'dataProviders.logo',
        'radiusSelectValues',
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
    const appConfigTranslations =
      tenant.app_config.data.attributes.localizations.data;
    const logoUrl = appConfig.logo.data.attributes.url;
    const faviconUrl = appConfig.favicon.data.attributes.url;
    const heroUrl = appConfig.hero.data.attributes.url;
    const openGraphUrl = appConfig.openGraph.data.attributes.url;

    const translationFile = {
      en: {},
    };

    const newAppConfig = {
      nextConfig: appConfig.nextConfig,
      brand: {
        name: appConfig.brandName,
        logoUrl: logoUrl,
        faviconUrl: faviconUrl,
        openGraphUrl: openGraphUrl,
      },
      contact: {
        email: appConfig.email,
        number: appConfig.phoneNumber,
        feedbackUrl: appConfig.feedbackUrl,
      },
      search: {
        defaultRadius: appConfig?.defaultRadiusValue ?? 0,
        radiusOptions: appConfig?.radiusSelectValues ?? null,
        resultsLimit: appConfig?.search?.resultsLimit ?? 25,
      },
      features: {
        map: {
          plugin: 'mapbox',
        },
      },
      adapters: {
        map: 'mapbox',
      },
      map: appConfig?.map ?? {
        center: [0, 0],
        zoom: 7,
      },
      alert: appConfig?.alert,
      theme: appConfig?.theme ?? null,
      hideAttribution: appConfig?.hideAttribution ?? true,
      plugins: [],
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
    };

    translationFile['en']['search.hero_title'] = appConfig.search.homePageTitle;
    translationFile['en']['search.query_placeholder'] =
      appConfig.search.queryInputPlaceholder;
    translationFile['en']['search.location_placeholder'] =
      appConfig.search.locationInputPlaceholder;
    translationFile['en']['search.no_results_fallback_text'] =
      appConfig?.search?.noResultsFallbackText;
    translationFile['en']['last_assured_text'] = appConfig?.lastAssuredText;
    translationFile['en']['categories_text'] = appConfig?.categoriesText;

    for (const page of appConfig?.pages ?? []) {
      if (page.page === 'home') {
        translationFile['en'][`meta_title`] = page.title;
        translationFile['en'][`meta_description`] = page.description;

        newAppConfig.pages[page.page] = {
          heroSection: {
            backgroundImageUrl: heroUrl,
          },
          meta: {
            title: page.title,
            description: page.description,
          },
          showLocationInput: page.showLocationInput ?? false,
          disableTour: page.disableTour ?? false,
        };
      } else if (page.page === 'resource') {
        newAppConfig.pages[page.page] = {
          hideCategories: page.hideCategories ?? false,
          hideLastAssured: page.hideLastAssured ?? false,
        };
      }
    }

    for (const menu of appConfig?.headerMenu ?? []) {
      newAppConfig.menus.header.push({
        name: menu.name,
        href: menu.href,
      });
    }

    for (const menu of appConfig?.footerMenu ?? []) {
      newAppConfig.menus.footer.push({
        name: menu.name,
        href: menu.href,
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
      if (!translationFile[data.locale]) {
        translationFile[data.locale] = {};
      }

      translationFile[data.locale]['search.hero_title'] =
        data?.search?.homePageTitle;
      translationFile[data.locale]['search.query_placeholder'] =
        data?.search?.queryInputPlaceholder;
      translationFile[data.locale]['search.location_placeholder'] =
        data?.search?.locationInputPlaceholder;
      translationFile[data.locale]['search.no_results_fallback_text'] =
        data?.search?.noResultsFallbackText;
      translationFile[data.locale]['last_assured_text'] = data?.lastAssuredText;
      translationFile[data.locale]['categories_text'] = data?.categoriesText;
    }

    const categoryFiles = {};
    for (const _category of categoryTranslations || []) {
      const category = _category.attributes;
      if (!(category.locale in categoryFiles)) {
        categoryFiles[category.locale] = [];
      }
      categoryFiles[category.locale] = categoryFiles[category.locale].concat(
        category.list.map((cat) => ({
          name: cat['name'],
          href: cat['href'],
          image: cat['image']?.['data']?.['attributes']?.['url'],
          subcategories: cat['subcategories'].map((sub) => ({
            name: sub['name'],
            href: sub['href'],
            query: sub['query'],
            queryType: sub['queryType'],
          })),
        })),
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
          image: category['image']?.['data']?.['attributes']?.['url'],
          subcategories: category['subcategories'].map((sub) => ({
            name: sub['name'],
            href: sub['href'],
            query: sub['query'],
            queryType: sub['queryType'],
          })),
        },
      ]);
    }

    for (const key in categoryFiles) {
      const categoryToWrite = categoryFiles[key];
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
      fs.writeFileSync(
        path.resolve(`public/locales/${key}/suggestions.json`),
        JSON.stringify(suggestionToWrite, null, 2),
      );
    }

    for (const plugin of appConfig?.plugins ?? []) {
      newAppConfig.plugins.push([
        plugin.__component.replace('plugin.', ''),
        plugin?.config ?? {},
      ]);
    }

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
      JSON.stringify(newAppConfig, null, 2),
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
