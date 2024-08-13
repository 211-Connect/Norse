import { TaxonomyAdapter } from '@/shared/adapters/taxonomy-adapter';
import { useQuery } from '@tanstack/react-query';

export function useTaxonomies(searchTerm?: string) {
  const { data } = useQuery({
    queryKey: ['taxonomies', searchTerm],
    queryFn: async () => {
      return await TaxonomyAdapter.getTaxonomies(searchTerm);
    },
    initialData: [],
  });

  console.log({ data });

  return { data };
}
