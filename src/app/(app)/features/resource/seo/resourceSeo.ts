import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import type { Resource } from '@/types/resource';

/**
 * The resource page's own URL, for `<link rel="canonical">` (ISS-2678). In v1 every page's canonical points to
 * itself (decided 2026-11-06; cross-site canonical is ISS-2676). The tenant's default locale is served without a
 * prefix, and the id is lower-cased so one resource has one URL.
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

function postalAddress(resource: Resource): JsonLd | undefined {
  const address =
    resource.addresses?.find((a) => a.type === 'physical' && a.rank === 1) ??
    resource.addresses?.find((a) => a.rank === 1) ??
    resource.addresses?.[0];
  if (!address) {
    return compact({
      '@type': 'PostalAddress',
      streetAddress: text(resource.address),
    });
  }
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
 * address where the record has them. Built from the record only; nothing comes from the URL. No hours: the record
 * carries them only as display text, and the markup parses no text (decided 2026-11-07).
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
