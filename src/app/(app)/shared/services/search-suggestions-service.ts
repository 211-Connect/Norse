'use server';

import { createLogger } from '@/lib/logger';
import { suggestionApiClient } from '@/lib/api/clients';
import { SuggestionCombinedResponseDto } from '@/lib/api/generated/data-contracts';
import { RequestParams } from '@/lib/api/generated/http-client';
import { ONE_MINUTE, stableHash, withCache } from '@/utilities/withCache';
import { getApiHeaders } from '@/lib/api';

const log = createLogger('search-suggestions-service');

const EMPTY_SUGGESTIONS: SuggestionCombinedResponseDto = {
  taxonomies: [],
  organizations: [],
};

const SUGGESTIONS_CACHE_TTL = 5 * ONE_MINUTE;

async function createSuggestionRequestParams(
  locale: string,
  tenantId: string,
): Promise<RequestParams> {
  return {
    headers: await getApiHeaders(tenantId, locale),
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

  return (
    (await withCache(
      `search_suggestions:${tenantId}:${locale}:${stableHash({
        locale,
        query: query.toLowerCase(),
        tenantId,
      })}`,
      async () => {
        try {
          const response =
            await suggestionApiClient.suggestionControllerGetSuggestions(
              { query, locale, tenant_id: tenantId },
              await createSuggestionRequestParams(locale, tenantId),
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
      },
      { redis: true, memory: true, ttl: SUGGESTIONS_CACHE_TTL },
    )) ?? EMPTY_SUGGESTIONS
  );
}
