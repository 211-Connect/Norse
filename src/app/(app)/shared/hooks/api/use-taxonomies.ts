'use client';

import { TaxonomyService } from '@/app/(app)/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../use-app-config';
import { useState } from 'react';

export function useTaxonomies(searchTerm: string = '') {
  const appConfig = useAppConfig();
  const { i18n } = useTranslation();

  const [savedData, setSavedData] = useState<any[]>([]);
  const { data } = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['taxonomies', i18n.language, searchTerm],
    queryFn: async () => {
      const taxonomies = await TaxonomyService.getTaxonomies(searchTerm, {
        locale: i18n.language,
        tenantId: appConfig.tenantId,
      });
      setSavedData(taxonomies);

      return taxonomies;
    },
    enabled: !!i18n.language && searchTerm.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { data: savedData, displayData: data || [] };
}
