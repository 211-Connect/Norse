import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import type { Resource } from '@/types/resource';

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
function bareHost(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '');
}

/**
 * The origin a canonical URL names: the tenant's first trusted domain (Norse's primary domain elsewhere too),
 * not whichever host the request came in on, so a tenant with several domains has one canonical. Only the first
 * `x-forwarded-proto` value counts, since a chain of proxies can append more.
 */
export function canonicalOrigin({
  trustedDomains,
  host,
  protocol,
}: {
  trustedDomains: string[];
  host: string;
  protocol: string;
}): { host: string; protocol: string } {
  const primary = trustedDomains.map(bareHost).find(Boolean);
  return {
    host: primary ?? host,
    protocol: protocol.split(',')[0]?.trim() || 'https',
  };
}

type JsonLd = Record<string, unknown>;

const text = (value: string | null | undefined) => value?.trim() || undefined;

/** Drops keys whose value is undefined or an empty object, so nothing is written as null or empty. */
function compact(value: JsonLd): JsonLd | undefined {
  const entries = Object.entries(value).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  const hasContent = entries.some(([key]) => key !== '@type');
  return hasContent ? Object.fromEntries(entries) : undefined;
}

/**
 * The address the page shows, and only that: the first physical one, as `address.tsx` picks it. A confidential
 * site arrives as `type: 'virtual'` (dagster's resource writer) and the page hides it behind a notice, so the
 * markup must never fall back to it, to another rank, or to the bare address string.
 */
function postalAddress(resource: Resource): JsonLd | undefined {
  const address = resource.addresses?.find(({ type }) => type === 'physical');
  if (!address) return undefined;
  return compact({
    '@type': 'PostalAddress',
    streetAddress:
      [text(address.address_1), text(address.address_2)]
        .filter(Boolean)
        .join(', ') || undefined,
    addressLocality: text(address.city),
    addressRegion: text(address.stateProvince),
    postalCode: text(address.postalCode),
    addressCountry: text(address.country),
  });
}

/**
 * schema.org JSON-LD for a resource page (ISS-2678): a `Service` provided by an `Organization`, with its phone and
 * the address the page shows, where the record has them. Every value is the record's own field; `url` is the
 * canonical. No hours: the record carries them only as display text, and the markup parses no text (decided
 * 2026-11-07).
 */
export function resourceJsonLd(
  resource: Resource,
  url: string,
): JsonLd | undefined {
  const name = text(resource.serviceName) ?? text(resource.name);
  if (!name) return undefined;

  // No coordinates: some records carry coordinates that contradict their address (ISS-2678), and the address
  // alone identifies the place. A place without an address is not a location.
  const address = postalAddress(resource);
  const serviceLocation = address
    ? compact({
        '@type': 'Place',
        name: text(resource.locationName),
        address,
      })
    : undefined;

  const channel = compact({
    '@type': 'ServiceChannel',
    serviceUrl: text(resource.website),
    servicePhone: compact({
      '@type': 'ContactPoint',
      telephone: text(resource.phone),
      email: text(resource.email),
    }),
    serviceLocation,
  });

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    url,
    description: text(resource.description),
    provider: compact({
      '@type': 'Organization',
      name: text(resource.organizationName),
      url: text(resource.organizationUrl),
    }),
    availableChannel: channel,
  });
}

/**
 * JSON for an inline `<script type="application/ld+json">`. `<`, `>`, `&` and the JavaScript line separators are
 * escaped as JSON unicode escapes, so record text can never close the script or open an HTML comment, and the
 * JSON reads back unchanged.
 */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}
