import { ResourceEntry } from '../lib/umami';
import { parseCommaSeparatedValues } from './parseCommaSeparatedValues';

type BuildAiSearchUrlArgs = {
  alert?: boolean;
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
  alert = false,
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

  if (alert) {
    params.set('a', '1');
  }

  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ''}`;
}
