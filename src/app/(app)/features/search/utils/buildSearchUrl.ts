import {
  applyWriterRules,
  searchIntent,
  serializeSearchUrl,
} from '@/app/(app)/features/search/intent/serialize';
import { AiClassificationScenario } from '@/app/(app)/shared/services/ai-classification-search-service';
import type { AiPredictOption } from '@/app/(app)/shared/services/ai-classification-search-service';
import { SearchEngine } from '@/types/appConfig';

export type BuildSearchUrlArgs = Partial<{
  aiScenario: AiClassificationScenario | null;
  clarifyScenario: AiClassificationScenario | null;
  clarifyOptions: AiPredictOption[] | null;
  query: string;
  queryLabel: string;
  queryType: string;
  organizationId: string;
  location: string | null;
  coordinates: string | number[] | null;
  distance: string | [string, string] | null;
  filters: Record<string, string[]> | null;
  taxonomies: string[] | null;
  skipLegacyLinkCheck: boolean;
}> & {
  searchEngine: SearchEngine;
};

/** The notify alert a search-and-notify scenario writes as `a`. */
const NOTIFY_ALERT: Partial<Record<AiClassificationScenario, string>> = {
  search_and_notify_low_info: 'low_info',
  search_and_notify_low_confidence: 'low_confidence',
};

/**
 * A /search URL for a new search. The arguments become an intent and an envelope; the serializer applies
 * the writer rules (query_type, trimming, taxonomy, location/coords/distance, page) and writes the URL.
 */
export function buildSearchUrl({
  aiScenario,
  clarifyScenario,
  clarifyOptions,
  query,
  queryLabel,
  queryType,
  organizationId,
  location,
  coordinates,
  distance,
  filters,
  taxonomies,
  skipLegacyLinkCheck,
  searchEngine = 'classic',
}: BuildSearchUrlArgs): string {
  const intent = searchIntent({
    query,
    queryLabel,
    queryType,
    organizationId,
    taxonomy: taxonomies,
    aiScenario: clarifyScenario,
    aiOptions: clarifyOptions,
    location,
    // Every caller passes a list. A string is read as its comma-separated parts; before ISS-2374 a string
    // was written only when it was exactly two characters long.
    coords:
      typeof coordinates === 'string'
        ? (coordinates.split(',') as unknown as number[])
        : coordinates,
    distance: Array.isArray(distance) ? distance.join(',') : distance,
    filters,
  });
  const alert = aiScenario ? NOTIFY_ALERT[aiScenario] : undefined;
  const envelope = {
    ...(alert ? { a: alert } : {}),
    ...(skipLegacyLinkCheck ? { sllc: '1' } : {}),
    passThrough: [],
  };
  const written = applyWriterRules(intent, envelope, { searchEngine });
  return serializeSearchUrl(written.intent, written.envelope);
}
