'use server';

import { createLogger } from '@/lib/logger';
import { suggestionApiClient } from '@/lib/api/clients';
import { SuggestionCombinedResponseDto } from '@/lib/api/generated/data-contracts';
import { RequestParams } from '@/lib/api/generated/http-client';

import { INTERNAL_API_KEY } from '../lib/constants';

const log = createLogger('search-suggestions-service');

const EMPTY_SUGGESTIONS: SuggestionCombinedResponseDto = {
  taxonomies: [],
  organizations: [],
};

function createSuggestionRequestParams(
  locale: string,
  tenantId: string,
): RequestParams {
  return {
    headers: {
      'accept-language': locale,
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
      'x-tenant-id': tenantId,
    },
  };
}

/**
 * Fetches both taxonomy and organization suggestions for the search
 * dialog's autocomplete in a single round trip.
 *
 * `GET /suggestion` always returns both groups unconditionally (no
 * opt-in/opt-out param) — callers that don't want the organizations group
 * rendered (e.g. tenants without `enableOrganizationSearch`) should simply
 * ignore the `organizations` field, not avoid calling this.
 */
export async function getSearchSuggestions(
  searchTerm: string,
  { locale, tenantId }: { locale: string; tenantId?: string },
): Promise<SuggestionCombinedResponseDto> {
  const query = searchTerm?.trim();

  if (!query) {
    return EMPTY_SUGGESTIONS;
  }

  if (!tenantId) {
    log.error({ locale }, 'Search suggestions request missing tenant ID');
    return EMPTY_SUGGESTIONS;
  }

  try {
    const response =
      await suggestionApiClient.suggestionControllerGetSuggestions(
        { query, locale, tenant_id: tenantId },
        createSuggestionRequestParams(locale, tenantId),
      );

    if (!response.data) {
      return EMPTY_SUGGESTIONS;
    }

    return {
      taxonomies: Array.isArray(response.data.taxonomies)
        ? response.data.taxonomies
        : [],
      organizations: Array.isArray(response.data.organizations)
        ? response.data.organizations
        : [],
    };
  } catch (error) {
    log.error(
      { err: error, tenantId, locale },
      'Search suggestions request failed',
    );
    return EMPTY_SUGGESTIONS;
  }
}
