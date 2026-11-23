import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { tenantCanonicalHost } from '@/utils/canonicalHost';

/**
 * The resource page's own URL, for `<link rel="canonical">` (ISS-2678). In v1 every page's canonical points to
 * itself (decided 2026-11-06; cross-site canonical is ISS-2676). Pass the record's id (`resource.id`), not the
 * URL's, and the origin from `canonicalOrigin`. The tenant's default locale is served without a prefix, and the
 * id is lower-cased so one resource has one URL.
 */
export function resourceCanonicalUrl({
  protocol,
  host,
  locale,
  defaultLocale,
  id,
}: {
  protocol: string;
  host: string;
  locale: string;
  defaultLocale: string;
  id: string;
}): string {
  const localePrefix = locale === defaultLocale ? '' : `/${locale}`;
  const path = withOptionalCustomBasePath(
    `${localePrefix}/search/${id.toLowerCase()}`,
  );
  return `${protocol}://${host}${path}`;
}

/** A trusted-domain entry as an admin may type it (`https://Search.WA211.org/`), as a bare lower-case host. */
/**
 * The origin a canonical URL names: the tenant's canonical host (`seo.canonicalHost`, else its first trusted
 * domain), not whichever host the request came in on, so a tenant with several domains has one canonical. Only
 * the first `x-forwarded-proto` value counts, since a chain of proxies can append more.
 */
export function canonicalOrigin({
  tenant,
  host,
  protocol,
}: {
  tenant: Parameters<typeof tenantCanonicalHost>[0];
  host: string;
  protocol: string;
}): { host: string; protocol: string } {
  return {
    host: tenantCanonicalHost(tenant) ?? host,
    protocol: protocol.split(',')[0]?.trim() || 'https',
  };
}
