import { useSearchStore } from '@/lib/context/search-context/search-store-provider';
import { TaxonomyService } from '@/shared/services/taxonomy-service';
import { Taxonomy } from '@/types/taxonomy';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { useLocale } from 'next-intl';

export function useTaxonomies() {
  const locale = useLocale();
  const { searchTerm } = useSearchStore((store) => ({
    searchTerm: store.searchTerm,
  }));
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const query = useQuery<Taxonomy[]>({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['taxonomies', locale, debouncedSearchTerm],
    queryFn: async () => {
      if (!locale || !searchTerm?.length) return [];

      return TaxonomyService.getTaxonomies(searchTerm, {
        locale: locale,
      });
    },
  });

  return query;
}
