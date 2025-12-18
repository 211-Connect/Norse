import { TaxonomyService } from '@/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useState } from 'react';

export function useTaxonomies(searchTerm?: string) {
  const router = useRouter();
  const [savedData, setSavedData] = useState<any[]>([]);

  const { data } = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['taxonomies', router.locale, searchTerm],
    queryFn: async () => {
      if (!router.locale || searchTerm.length === 0) return [];

      const taxonomies = await TaxonomyService.getTaxonomies(searchTerm, {
        locale: router.locale,
      });
      setSavedData(taxonomies);

      return taxonomies;
    },
  });

  return { data: savedData, displayData: data };
}
