'use server';

import {
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryResponseDto,
  SearchQueryApiDto,
} from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';
import { QueryType } from '../../lib/search-utils';
import { FindResourcesQuery } from '../../services/search-service';

const toInput = (
  payload: PrintableDirectoryControllerCreateSourcePayload,
): PrintableDirectoryControllerCreateSourcePayload => {
  if (payload.type === 'query') {
    const payloadQueryParams = payload.query.params;

    const params: SearchQueryApiDto & Pick<FindResourcesQuery, 'location'> = {};

    if ('age' in payloadQueryParams && payloadQueryParams.age) {
      params.age = Number(payloadQueryParams.age);
    }

    if ('coords' in payloadQueryParams && payloadQueryParams.coords) {
      params.coords = String(payloadQueryParams.coords);

      if ('distance' in payloadQueryParams && payloadQueryParams.distance) {
        params.distance = Number(payloadQueryParams.distance);
      }

      if ('location' in payloadQueryParams && payloadQueryParams.location) {
        params.location = String(payloadQueryParams.location);
      }
    }

    if (
      'filters' in payloadQueryParams &&
      payloadQueryParams.filters &&
      typeof payloadQueryParams.filters === 'object'
    ) {
      params.filters = payloadQueryParams.filters;
    }

    if ('query' in payloadQueryParams && payloadQueryParams.query) {
      params.query = String(payloadQueryParams.query);
    }

    if ('query_type' in payloadQueryParams && payloadQueryParams.query_type) {
      params.query_type = payloadQueryParams.query_type as QueryType;
    }

    if (
      'taxonomy' in payloadQueryParams &&
      payloadQueryParams.taxonomy &&
      (typeof payloadQueryParams.taxonomy === 'string' ||
        Array.isArray(payloadQueryParams.taxonomy))
    ) {
      params.taxonomy = payloadQueryParams.taxonomy;
    }

    return {
      ...payload,
      query: {
        title: payload.query.title,
        params,
      },
    };
  }
  return payload;
};

type CreatePrintableDirectorySourceParams = {
  directoryId: string;
  sectionId: string;
  payload: PrintableDirectoryControllerCreateSourcePayload;
  tenantId?: string;
};

export async function createPrintableDirectorySource({
  directoryId,
  sectionId,
  payload,
  tenantId,
}: CreatePrintableDirectorySourceParams): Promise<PrintableDirectoryResponseDto | null> {
  const headers = await getAuthHeaders(tenantId);

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreateSource(
        {
          id: directoryId,
          sectionId,
        },
        toInput(payload),
        {
          headers,
          cache: 'no-store',
        },
      );

    return response.data;
  } catch {
    return null;
  }
}
