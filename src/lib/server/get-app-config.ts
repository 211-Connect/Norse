import qs from 'qs';
import { STRAPI_TOKEN, STRAPI_URL, TENANT_ID } from '../constants';
import { getLocale } from 'next-intl/server';
import { AppConfig } from '@/types/app-config';
import { flattenAttributes } from './flatten-attributes';

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
        'homePage',
        'resourcePage',
        'dataProviders',
        'dataProviders.logo',
        'radiusSelectValues',
        'sms',
      ],
    },
  },
});

export async function getAppConfig() {
  const locale = await getLocale();
  const response = await fetch(
    `${STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${TENANT_ID}&${query}&locale=${locale}`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    },
  );

  if (response.ok) {
    const { data } = await response.json();

    return {
      data: flattenAttributes(data[0])?.app_config as AppConfig,
      error: null,
    };
  }

  return { data: null, error: 'Failed to fetch app config' };
}
