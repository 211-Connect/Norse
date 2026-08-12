import { deriveQueryType } from '@/app/(app)/shared/lib/search-utils';
import { AiClassificationScenario } from '@/app/(app)/shared/services/ai-classification-search-service';
import type { AiPredictOption } from '@/app/(app)/shared/services/ai-classification-search-service';
import { parseCommaSeparatedValues } from '@/app/(app)/shared/utils/parseCommaSeparatedValues';
import { SearchEngine } from '@/types/appConfig';

function normalizeHsisTaxonomies(
  hsisTaxonomies: string[] | null | undefined,
): string[] {
  return parseCommaSeparatedValues(hsisTaxonomies ?? undefined) ?? [];
}

export type BuildSearchUrlArgs = Partial<{
  aiScenario: AiClassificationScenario | null;
  clarifyScenario: AiClassificationScenario | null;
  clarifyOptions: AiPredictOption[] | null;
  query: string;
  queryLabel: string;
  queryType: string;
  location: string | null;
  coordinates: string | number[] | null;
  distance: string | [string, string] | null;
  filters: Record<string, string[]> | null;
  taxonomies: string[] | null;
  skipLegacyLinkCheck: boolean;
}> & {
  searchEngine: SearchEngine;
};

export function buildSearchUrl({
  aiScenario,
  clarifyScenario,
  clarifyOptions,
  query,
  queryLabel,
  queryType: originQueryType,
  location: originLocation,
  coordinates: originCoordinates,
  distance: originDistance,
  filters,
  taxonomies,
  skipLegacyLinkCheck,
  searchEngine = 'classic',
}: BuildSearchUrlArgs): string {
  const params = new URLSearchParams();

  const queryType = deriveQueryType({
    query: query,
    originQueryType: originQueryType,
    searchEngine,
  });

  const normalizedQuery = query?.trim();
  if (normalizedQuery) {
    params.set('query', normalizedQuery);
  }

  const normalizedQueryLabel = queryLabel?.trim();
  if (normalizedQueryLabel) {
    params.set('query_label', normalizedQueryLabel);
  }

  params.set('query_type', queryType);

  const normalizedTaxonomies = normalizeHsisTaxonomies(taxonomies);
  if (normalizedTaxonomies.length > 0) {
    params.set('taxonomy', normalizedTaxonomies.join(','));
  }

  if (aiScenario === 'search_and_notify_low_info') {
    params.set('a', 'low_info');
  } else if (aiScenario === 'search_and_notify_low_confidence') {
    params.set('a', 'low_confidence');
  }

  if (clarifyScenario) {
    params.set('ai_scenario', clarifyScenario);
  }

  if (Array.isArray(clarifyOptions) && clarifyOptions.length > 0) {
    clarifyOptions.forEach((option, index) => {
      params.append(`ai_options[${index}][code]`, option.code);
      params.append(`ai_options[${index}][score]`, String(option.score));
      params.append(
        `ai_options[${index}][pre_selected]`,
        option.pre_selected ? '1' : '0',
      );

      if (
        typeof option.results_count === 'number' &&
        Number.isFinite(option.results_count)
      ) {
        params.append(
          `ai_options[${index}][results_count]`,
          String(option.results_count),
        );
      }
    });
  }

  const hasLocation = originCoordinates?.length === 2;
  if (hasLocation) {
    const location = originLocation?.trim();
    if (location) {
      params.set('location', location);
    }

    const coords = (
      typeof originCoordinates === 'string'
        ? originCoordinates
        : originCoordinates.join(',')
    )?.trim();
    if (coords) {
      params.set('coords', coords);
    }

    const distance = (
      typeof originDistance === 'string'
        ? originDistance
        : originDistance?.join(',')
    )?.trim();
    if (distance) {
      params.set('distance', distance);
    }
  }

  if (filters && Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([key, values]) => {
      values.forEach((value, index) => {
        params.append(`filters[${key}][${index}]`, value);
      });
    });
  }

  if (skipLegacyLinkCheck) {
    params.set('sllc', '1');
  }

  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ''}`;
}
