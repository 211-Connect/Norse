import { useQueryState } from 'nuqs';

export function useSearchQuery() {
  return useQueryState('query');
}
