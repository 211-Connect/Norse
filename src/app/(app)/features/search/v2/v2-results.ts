/**
 * Prototype (Lucas 2026-11-18, 3A): the result cards come from `/v2/search`, like the pins and the filters,
 * so the region and area parameters scope the list too. No React, so the unit tests can import it.
 *
 * A v2 hit has the same `_source` as a v1 hit. `v1ById` keeps the richer v1 object (translated facets) for a
 * service both searches returned; a service only v2 returned is mapped here.
 */
import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';
import type { ResultType } from '@/app/(app)/shared/store/results';
import { transformFacetsToArray } from '@/app/(app)/shared/utils/toFacetsWithTranslation';
import { ensureUrlProtocol } from '@/utils';

import { totalOf, type V2Hit, type V2Response } from './v2-contract';

const obj = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

/** One v2 hit as a card's data. Missing fields are left out, as the v1 mapper does. */
export function hitToResult(
  hit: V2Hit,
  facetDefinitions: Record<string, Record<string, string>> = {},
  locale = 'en',
): ResultType {
  const source = obj(hit._source);
  const service = obj(source.service);
  const location = obj(source.location);
  const organization = obj(source.organization);
  const facets = transformFacetsToArray(
    source.facets,
    facetDefinitions,
    locale,
  );
  const result = {
    _id: hit._id,
    id: source.service_at_location_id ?? null,
    alert: service.alert ?? null,
    alertDate: service.alertDate ?? null,
    priority: source.priority,
    serviceName: service.name ?? null,
    attribution: source.attribution ?? null,
    name: source.name ?? null,
    locationName: location.name ?? null,
    organizationAlternateName: organization.alternate_name ?? null,
    summary: service.summary ?? null,
    description: service.description ?? null,
    phone: source.phone ?? null,
    website: ensureUrlProtocol(source.url as string | undefined),
    address: formatAddressForDisplay(location.physical_address),
    location: location.point ?? null,
    taxonomies: source.taxonomies ?? null,
    eligibility: service.eligibility ?? null,
    applicationProcess: service.application_process ?? null,
    hours: source.schedule ?? null,
    attributeValues: source.attribute_values ?? null,
    // The card badges read this; left out when empty, as v1 does.
    facets: facets.length > 0 ? facets : null,
  };
  return Object.fromEntries(
    Object.entries(result).filter(([, value]) => value != null),
  ) as unknown as ResultType;
}

/**
 * The cards of a v2 response, in the server's order. `null` when there is no response yet, so the page keeps
 * the v1 cards it was rendered with until the v2 answer arrives.
 */
export function v2Results(
  data: V2Response | null | undefined,
  v1: readonly ResultType[],
  locale = 'en',
): { results: ResultType[]; totalResults: number } | null {
  const hits = data?.search?.hits?.hits;
  if (!data || !Array.isArray(hits)) return null;
  const v1ById = new Map(v1.map((result) => [result._id, result]));
  // Same definitions v1 builds from the response facet list, so badge names are translated alike.
  const facetDefinitions = Object.fromEntries(
    (Array.isArray(data.facets) ? data.facets : []).map((f) => [
      f.key,
      { en: f.name?.en, [locale]: f.name?.locale },
    ]),
  );
  return {
    results: hits.map(
      (hit) =>
        v1ById.get(hit._id) ?? hitToResult(hit, facetDefinitions, locale),
    ),
    totalResults: totalOf(data),
  };
}

/** The note for a weak match with no cards: the tenant's own text first, as the v1 no-results card does. */
export function weakMatchText(
  fallbackText: string | undefined,
  contactNumber: string | undefined,
): string {
  const text = fallbackText?.trim();
  return (
    text ||
    `No results found for your search. Need help? Call ${contactNumber ?? '211'}.`
  );
}
