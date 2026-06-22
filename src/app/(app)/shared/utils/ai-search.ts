import { ResourceEntry } from '../lib/umami';
import { AiClassificationScenario } from '../services/ai-classification-search-service';
import { parseCommaSeparatedValues } from './parseCommaSeparatedValues';

type BuildAiSearchUrlArgs = {
  scenario?: AiClassificationScenario;
  query: string;
  queryLabel?: string;
  taxonomies?: string[] | null | undefined;
};

export function normalizeHsisTaxonomies(
  hsisTaxonomies: string[] | null | undefined,
): string[] {
  return parseCommaSeparatedValues(hsisTaxonomies ?? undefined) ?? [];
}

export function buildAiSearchUrl({
  scenario,
  query,
  queryLabel,
  taxonomies,
}: BuildAiSearchUrlArgs): string {
  const params = new URLSearchParams();

  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    params.set('query', normalizedQuery);
  }

  const normalizedQueryLabel = queryLabel?.trim();
  if (normalizedQueryLabel) {
    params.set('query_label', normalizedQueryLabel);
  }

  params.set('query_type', 'hybrid');
  params.set('entry', ResourceEntry.SearchCard);

  const normalizedTaxonomies = normalizeHsisTaxonomies(taxonomies);
  if (normalizedTaxonomies.length > 0) {
    params.set('taxonomy', normalizedTaxonomies.join(','));
  }

  if (scenario === 'search_and_notify_low_info') {
    params.set('a', 'low_info');
  } else if (scenario === 'search_and_notify_low_confidence') {
    params.set('a', 'low_confidence');
  }

  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ''}`;
}
