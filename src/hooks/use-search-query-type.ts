import { useQueryState } from 'nuqs';

export function useSearchQueryType() {
  return useQueryState('query_type');
}
