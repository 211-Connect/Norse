'use server';

import dayjs from 'dayjs';
import { cache } from 'react';

import {
  ApiResource,
  ApiResourceBatchResponse,
  Resource,
} from '@/types/resource';
import {
  CacheKey,
  ONE_HOUR,
  stableHash,
  withCache,
} from '@/utilities/withCache';
import { ensureUrlProtocol } from '@/utils';

import { API_URL, INTERNAL_API_KEY } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';

const RESOURCE_BATCH_LIMIT = 100;

function createResourceHeaders(
  locale: string,
  tenantId?: string,
  contentType?: string,
): HeadersInit {
  return {
    'accept-language': locale,
    'x-api-version': '1',
    'x-api-key': INTERNAL_API_KEY || '',
    ...(tenantId && { 'x-tenant-id': tenantId }),
    ...(contentType && { 'Content-Type': contentType }),
  };
}

function transformApiResource(data: ApiResource): Resource {
  const facetsEnMap = new Map(
    data?.facetsEn?.map((facet) => [facet.code, facet]) ?? [],
  );

  return {
    id: data._id,
    originalId: data?.originalId ?? null,
    tenantId: data?.tenant_id ?? null,
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
    serviceArea: data?.serviceArea ?? null,
    serviceAreaDescription: data?.translation?.serviceAreaDescription ?? null,
    transportation: data?.translation?.transportation ?? null,
    accessibility: data?.translation?.accessibility ?? null,
    facets:
      data?.translation?.facets?.map((facet) => {
        const englishFacet = facetsEnMap.get(facet.code);
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
  tenantId?: string,
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
  url: string,
  options: { locale: string; tenantId?: string; cacheKey: CacheKey },
): Promise<Resource | null> {
  return await withCache(
    options.cacheKey,
    async () => {
      const searchParams = new URLSearchParams({
        locale: options.locale,
      });

      if (options.tenantId) {
        searchParams.append('tenant_id', options.tenantId);
      }

      const data: ApiResource | null = await fetchWrapper(
        `${url}?${searchParams.toString()}`,
        {
          headers: createResourceHeaders(options.locale, options.tenantId),
          cache: 'no-store',
        },
      );

      console.log(data);

      if (!data) {
        return null;
      }

      return transformApiResource(data);
    },
    { memory: false, redis: true, ttl: ONE_HOUR },
  );
}

const fetchAndTransformResource = cache(fetchAndTransformResourceOrigin);

async function fetchAndTransformResourcesOrigin(
  idsKey: string,
  ids: string[],
  options: { locale: string; tenantId?: string; cacheKey: CacheKey },
): Promise<Record<string, Resource>> {
  void idsKey;

  const resources = await withCache(
    options.cacheKey,
    async () => {
      const data = await fetchWrapper<ApiResourceBatchResponse>(
        `${API_URL}/resource/batch`,
        {
          method: 'POST',
          headers: createResourceHeaders(
            options.locale,
            options.tenantId,
            'application/json',
          ),
          body: { ids },
          cache: 'no-store',
        },
      );

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

  return resources ?? {};
}

const fetchAndTransformResources = cache(fetchAndTransformResourcesOrigin);

export async function getResource(
  id: string,
  locale: string,
  tenantId?: string,
): Promise<Resource | null> {
  const url = `${API_URL}/resource/${id}`;
  return fetchAndTransformResource(url, {
    locale,
    tenantId,
    cacheKey: `resource:${id}:${locale}`,
  });
}

export async function getResourceByOriginalId(
  originalId: string,
  locale: string,
  tenantId?: string,
): Promise<Resource | null> {
  const url = `${API_URL}/resource/original/${originalId}`;
  return fetchAndTransformResource(url, {
    locale,
    tenantId,
    cacheKey: `resource:${originalId}:${locale}`,
  });
}

export async function getResources(
  ids: string[],
  locale: string,
  tenantId?: string,
): Promise<Resource[]> {
  if (ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(ids)];
  const chunks = chunkIds(uniqueIds, RESOURCE_BATCH_LIMIT);

  const settledChunks = await Promise.allSettled(
    chunks.map((chunk) =>
      fetchAndTransformResources(chunk.join(','), chunk, {
        locale,
        tenantId,
        cacheKey: `resource_batch:${tenantId ?? 'public'}:${locale}:${stableHash(chunk)}`,
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
