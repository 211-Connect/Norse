const qs = require('qs');
const path = require('path');
const fs = require('fs-extra');
const syncClient = require('sync-rest-client');

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
        'pages',
        'search',
        'plugins',
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
module.exports = async function createFromStrapi(dir) {
  if (!STRAPI_URL || !STRAPI_TOKEN || !TENANT_ID) return;

  try {
    const res = syncClient.get(
      `${STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${TENANT_ID}&${query}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      }
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
        number: appConfig.number,
        feedbackUrl: appConfig.feedbackUrl,
      },
      search: {
        defaultRadius: appConfig?.defaultRadius ?? 0,
        radiusOptions: appConfig?.radiusSelectValues ?? null,
      },
      features: {
        map: {
          plugin: 'mapbox',
        },
      },
      theme: appConfig?.theme ?? null,
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

    for (const provider of appConfig?.providers ?? []) {
      newAppConfig.providers.push({
        name: provider.name,
        href: provider.url,
        logo: provider.logo,
      });
    }

    for (const locale of appConfigTranslations || []) {
      const data = locale.attributes;
      if (!translationFile[data.locale]) {
        translationFile[data.locale] = {};
      }

      translationFile[data.locale]['search.hero_title'] =
        data.search.homePageTitle;
      translationFile[data.locale]['search.query_placeholder'] =
        data.search.queryInputPlaceholder;
      translationFile[data.locale]['search.location_placeholder'] =
        data.search.locationInputPlaceholder;
    }

    for (let catI = 0; catI < categories.length; catI++) {
      const category = categories[catI];
      const subcategories = category.subcategories;
      translationFile['en'][`categories.${catI}`] = category.name;

      newAppConfig.categories.push({
        id: category.id,
        name: category.name,
        href: category.href,
        image: category?.image?.data?.attributes?.url,
        subcategories: category.subcategories.map((subcategory, key) => {
          return {
            id: subcategory.id,
            name: subcategory.name,
            href: subcategory.href,
            query: subcategory.query,
            query_type: subcategory.queryType,
          };
        }),
      });

      for (let subCatI = 0; subCatI < subcategories.length; subCatI++) {
        const subcategory = subcategories[subCatI];
        translationFile['en'][`categories.${catI}.subcategories.${subCatI}`] =
          subcategory.name;

        for (const locale of categoryTranslations || []) {
          const data = locale.attributes;

          if (!translationFile[data.locale]) {
            translationFile[data.locale] = {};
          }

          const categories = data.list;
          const subcategories = categories?.[catI]?.subcategories;

          if (categories?.[catI]) {
            translationFile[data.locale][`categories.${catI}`] =
              categories[catI].name;
          }

          if (subcategories?.[subCatI]) {
            translationFile[data.locale][
              `categories.${catI}.subcategories.${subCatI}`
            ] = subcategories[subCatI].name;
          }
        }
      }
    }

    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      translationFile['en'][`suggestions.${i}`] = suggestion.displayName;

      newAppConfig.suggestions.push({
        id: i,
        value: suggestion.displayName,
        term: suggestion.taxonomies,
      });

      for (const locale of suggestionTranslations || []) {
        const data = locale.attributes;

        if (!translationFile[data.locale]) {
          translationFile[data.locale] = {};
        }

        const suggestions = data.list;

        if (suggestions?.[i]) {
          translationFile[data.locale][`suggestions.${i}`] =
            suggestions[i].displayName;
        }
      }
    }

    for (const plugin of appConfig?.plugins ?? []) {
      newAppConfig.plugins.push([
        plugin.__component.replace('plugin.', ''),
        plugin?.config ?? {},
      ]);
    }

    fs.writeFileSync(
      path.join(dir, 'tmp/app.json'),
      JSON.stringify(newAppConfig, null, 2)
    );

    for (const key in translationFile) {
      fs.mkdirpSync(path.join(dir, `public/locales/${key}`));
      fs.writeFileSync(
        path.join(dir, `public/locales/${key}/dynamic.json`),
        JSON.stringify(translationFile[key], null, 2)
      );
    }
  } catch (err) {
    console.log(err);
  }
};
