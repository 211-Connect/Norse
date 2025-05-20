import qs from 'qs';
import { STRAPI_TOKEN, STRAPI_URL } from '../constants';
import { getLocale } from 'next-intl/server';
import { AppConfig } from '@/types/app-config';
import { flattenAttributes } from '../../utils/flatten-attributes';
import { getTenantId } from './get-tenant-id';
import { unstable_cache } from 'next/cache';

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

const getCachedAppConfig = unstable_cache(
  async (tenantId: string, locale: string) => {
    const response = await fetch(
      `${STRAPI_URL}/api/tenants?filters[tenantId][$eq]=${tenantId}&${query}&locale=${locale}`,
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

    throw new Error('Unable to get app config');
  },
  [],
  {
    revalidate: 15 * 60,
  },
);

export async function fetchAppConfig() {
  const [tenantId, locale] = await Promise.all([getTenantId(), getLocale()]);

  if (!tenantId) {
    return { data: null, error: 'Tenant id not set' };
  }

  const currentLocale = locale || 'en';

  try {
    const response = await getCachedAppConfig(tenantId, currentLocale);
    return response;
  } catch (error) {
    return { data: null, error: 'Failed to fetch app config' };
  }
}
