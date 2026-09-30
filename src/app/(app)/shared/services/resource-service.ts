'use server';

import dayjs from 'dayjs';
import { cache } from 'react';

import { resourceApiClient } from '@/lib/api/clients';
import type { TransformedResourceOpenApiDto } from '@/lib/api/generated/data-contracts';
import type { Resource, ServiceArea } from '@/types/resource';
import {
  CacheKey,
  ONE_HOUR,
  stableHash,
  withCache,
} from '@/utilities/withCache';
import { ensureUrlProtocol } from '@/utils';

import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';
import { getApiHeaders } from '../lib/get-api-headers';

const RESOURCE_BATCH_LIMIT = 100;

function transformApiResource(data: TransformedResourceOpenApiDto): Resource {
  const facetsEnMap = new Map(
    data?.facetsEn?.map((facet) => [facet.code, facet]) ?? [],
  );

  return {
    id: data.serviceAtLocationId ?? data._id,
    serviceAtLocationId: data?.serviceAtLocationId ?? null,
    _id: data?._id ?? null,
    originalId: data?.originalId ?? null,
    tenantId: data?.tenant_id ?? null,
    alert: data?.translation?.alert ?? null,
    alertDate: data?.translation?.alertDate ?? null,
    serviceName: data?.translation?.serviceName ?? null,
    attribution: data?.attribution ?? null,
    name: data?.translation?.displayName ?? data?.displayName ?? null,
    locationName: data?.locationName ?? null,
    description: data?.translation?.serviceDescription ?? null,
    phone:
      data?.phone ??
      data?.displayPhoneNumber ??
      data?.phoneNumbers?.find((p) => p.rank === 1 && p.type === 'voice')
        ?.number ??
      null,
    website: ensureUrlProtocol(data?.website),
    address:
      data?.address ??
      data?.addresses?.find((a) => a.rank === 1)?.address_1 ??
      null,
    addresses: data?.addresses ?? null,
    phoneNumbers: data?.translation?.phoneNumbers ?? data?.phoneNumbers ?? null,
    email: data?.email ?? null,
    hours: data?.translation?.hours ?? null,
    hoursDescription: data?.translation?.hoursDescription ?? null,
    languages: data?.translation?.languages ?? null,
    interpretationServices: data?.translation?.interpretationServices ?? null,
    applicationProcess: data?.translation?.applicationProcess ?? null,
    fees: data?.translation?.fees ?? null,
    requiredDocuments: data?.translation?.requiredDocuments ?? null,
    eligibilities: data?.translation?.eligibilities ?? null,
    serviceAreaName: data?.serviceAreaName ?? null,
    categories: data?.translation?.taxonomies ?? null,
    lastAssuredOn: data?.lastAssuredDate
      ? dayjs(data.lastAssuredDate).format('MM/DD/YYYY')
      : '',
    location: data?.location?.coordinates
      ? {
          coordinates: data.location.coordinates,
        }
      : null,
    organizationName: data?.organizationName ?? null,
    organizationDescription: data?.translation?.organizationDescription ?? null,
    organizationUrl: data?.organizationUrl ?? null,
    serviceArea: (data?.serviceArea as ServiceArea) ?? null,
    serviceAreaDescription: data?.translation?.serviceAreaDescription ?? null,
    transportation: data?.translation?.transportation ?? null,
    accessibility: data?.translation?.accessibility ?? null,
    facets:
      data?.translation?.facets?.map((facet) => {
        const englishFacet = facetsEnMap.get(facet.code ?? '');
        return {
          ...facet,
          taxonomyNameEn: englishFacet?.taxonomyName,
          termNameEn: englishFacet?.termName,
        };
      }) ?? null,
    attributeValues: data?.translation?.attributeValues ?? null,
    linkQualityUrls:
      data?.translation?.linkQualityUrls
        ?.map((qualityLink) => {
          const normalizedUrl = ensureUrlProtocol(qualityLink.url);

          if (!normalizedUrl) {
            return null;
          }

          return {
            ...qualityLink,
            url: normalizedUrl,
          };
        })
        .filter((qualityLink) => qualityLink !== null) ?? null,
    contacts: data?.translation?.contacts ?? null,
  };
}

function chunkIds(ids: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    chunks.push(ids.slice(index, index + chunkSize));
  }

  return chunks;
}

async function fetchResourcesIndividually(
  ids: string[],
  locale: string,
  tenantId: string,
): Promise<Record<string, Resource>> {
  const resources = await Promise.all(
    ids.map(async (id) => {
      const resource = await getResource(id, locale, tenantId).catch(
        () => null,
      );
      return resource ? ([id, resource] as const) : null;
    }),
  );

  return Object.fromEntries(
    resources.filter(
      (entry): entry is readonly [string, Resource] => entry !== null,
    ),
  );
}

async function fetchAndTransformResourceOrigin(
  id: string,
  options: { locale: string; tenantId: string; cacheKey: CacheKey },
  originalId?: boolean,
): Promise<Resource | null> {
  return await withCache(
    options.cacheKey,
    async () => {
      const args = {
        id,
        locale: options.locale,
        tenant_id: options.tenantId,
      } as const;
      const headers = {
        ...(await getApiHeaders(options.tenantId)),
        'accept-language': options.locale,
      };

      const response = await (originalId
        ? resourceApiClient.resourceControllerGetResourceByOriginalId(args, {
            headers,
          })
        : resourceApiClient.resourceControllerGetResourceById(args, {
            headers,
          }));

      return transformApiResource(response.data);
    },
    { memory: false, redis: true, ttl: ONE_HOUR },
  );
}

const fetchAndTransformResource = cache(fetchAndTransformResourceOrigin);

async function fetchAndTransformResourcesBatchOrigin(
  ids: string[],
  options: { locale: string; tenantId: string; cacheKey: CacheKey },
): Promise<Record<string, Resource> | null> {
  return await withCache(
    options.cacheKey,
    async () => {
      const response =
        await resourceApiClient.resourceControllerGetResourcesBatch(
          { locale: options.locale, tenant_id: options.tenantId },
          { ids },
          {
            headers: {
              ...(await getTenantApiKeyHeaders(options.tenantId)),
              'accept-language': options.locale,
            },
          },
        );

      const data = response.data;

      if (!data?.data) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(data.data).map(([id, resource]) => [
          id,
          transformApiResource(resource),
        ]),
      );
    },
    { memory: false, redis: true, ttl: ONE_HOUR },
  );
}

const fetchAndTransformResourcesBatch = cache(
  fetchAndTransformResourcesBatchOrigin,
);

export async function getResource(
  id: string,
  locale: string,
  tenantId: string,
): Promise<Resource | null> {
  return fetchAndTransformResource(id, {
    locale,
    tenantId,
    cacheKey: `resource:${tenantId}:${id}:${locale}`,
  });
}

export async function getResourceByOriginalId(
  originalId: string,
  locale: string,
  tenantId: string,
): Promise<Resource | null> {
  return fetchAndTransformResource(
    originalId,
    {
      locale,
      tenantId,
      cacheKey: `resource:${tenantId}:original:${originalId}:${locale}`,
    },
    true,
  );
}

export async function getResources(
  ids: string[],
  locale: string,
  tenantId: string,
): Promise<Resource[]> {
  if (ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(ids)];
  const chunks = chunkIds(uniqueIds, RESOURCE_BATCH_LIMIT);

  const settledChunks = await Promise.allSettled(
    chunks.map((chunk) =>
      fetchAndTransformResourcesBatch(chunk, {
        locale,
        tenantId: tenantId,
        cacheKey: `resource_batch:${tenantId}:${locale}:${stableHash(chunk)}`,
      }),
    ),
  );

  const resourcesById: Record<string, Resource> = {};
  const fallbackChunks: string[][] = [];

  settledChunks.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      Object.assign(resourcesById, result.value);
      return;
    }

    fallbackChunks.push(chunks[index]);
  });

  if (fallbackChunks.length > 0) {
    const fallbackMaps = await Promise.all(
      fallbackChunks.map((chunk) =>
        fetchResourcesIndividually(chunk, locale, tenantId),
      ),
    );

    fallbackMaps.forEach((chunkMap) => {
      Object.assign(resourcesById, chunkMap);
    });
  }

  return ids
    .map((id) => resourcesById[id] ?? null)
    .filter((resource): resource is Resource => resource !== null);
}
