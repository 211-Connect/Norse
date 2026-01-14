import { Tenant } from '@/payload/payload-types';
import type { CollectionAfterLoginHook } from 'payload';
import { mergeHeaders, generateCookie, getCookieExpiration } from 'payload';
import { defaultLocale } from '@/payload/i18n/locales';
import { findResourceDirectoryByHost } from '../../ResourceDirectories/actions';

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({
  req,
  user,
}) => {
  const host = req.headers.get('host');
  if (!host) {
    return user;
  }

  const resourceDirectory = await findResourceDirectoryByHost(
    host,
    defaultLocale,
    true,
  );
  if (!resourceDirectory) {
    return user;
  }

  // If a matching tenant is found, set the 'payload-tenant' cookie
  const tenantCookie = generateCookie({
    name: 'payload-tenant',
    expires: getCookieExpiration({ seconds: 7200 }),
    path: '/',
    returnCookieAsObject: false,
    value: String((resourceDirectory.tenant as Tenant).id),
  });

  // Merge existing responseHeaders with the new Set-Cookie header
  const newHeaders = new Headers({
    'Set-Cookie': tenantCookie as string,
  });

  // Ensure you merge existing response headers if they already exist
  req.responseHeaders = req.responseHeaders
    ? mergeHeaders(req.responseHeaders, newHeaders)
    : newHeaders;

  return user;
};
