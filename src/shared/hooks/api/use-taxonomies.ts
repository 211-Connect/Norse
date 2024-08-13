import { TaxonomyService } from '@/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';

export function useTaxonomies(searchTerm?: string) {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['taxonomies', router.locale, searchTerm],
    queryFn: async () => {
      if (!router.locale || searchTerm.length === 0) return [];

      return await TaxonomyService.getTaxonomies(searchTerm, {
        locale: router.locale,
      });
    },
    initialData: [],
  });

  return { data };
}
