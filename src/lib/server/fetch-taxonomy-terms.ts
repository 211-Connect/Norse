import { Taxonomy } from '@/types/taxonomy';
import { apiFetch } from './api-fetch';

export async function fetchTaxonomyTerms(
  terms: string[],
): Promise<{ data: Taxonomy[]; error: null } | { data: null; error: string }> {
  const response = await apiFetch(`/taxonomy/term?terms=${terms}`);

  if (!response.ok) {
    return { data: null, error: 'Unable to fetch taxonomies' };
  }

  const json = await response.json();

  return {
    data:
      json?.hits.hits.map((hit: any) => ({
        id: hit._id,
        code: hit._source.code,
        name: hit._source.name,
      })) ?? [],
    error: null,
  };
}
