import { TaxonomyService } from '@/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

export function useTaxonomies(searchTerm?: string) {
  const locale = useLocale();
  const query = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['taxonomies', locale, searchTerm],
    queryFn: async () => {
      if (!locale || !searchTerm?.length) return [];

      return await TaxonomyService.getTaxonomies(searchTerm, {
        locale: locale,
      });
    },
  });

  return query;
}
