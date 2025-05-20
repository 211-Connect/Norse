import { getLocale } from 'next-intl/server';
import { getTenantId } from './get-tenant-id';
import { API_URL } from '../constants';
import QueryString from 'qs';

export async function apiFetch(url: string, init?: RequestInit) {
  if (!(typeof window === 'undefined')) {
    throw new Error('apiFetch can only be used on the server');
  }

  const locale = await getLocale();
  const tenantId = await getTenantId();

  if (!tenantId) {
    console.info(`Tenant id not set. Tenant id: ${tenantId}`);
    throw new Error('Tenant id not set.');
  }

  if (!locale) {
    console.warn('Locale not set. Falling back to en');
  }

  const globalParams = QueryString.stringify({
    locale: locale || 'en',
    tenant_id: tenantId,
  });

  const delimiter = url.includes('?') ? '&' : '?';

  return fetch(`${API_URL}${url}${delimiter}${globalParams}`, {
    ...(init ? init : {}),
    headers: {
      'x-api-version': '1',
      'accept-language': locale || 'en',
      'x-tenant-id': tenantId,
      ...(init?.headers ? init.headers : {}),
    },
  });
}
