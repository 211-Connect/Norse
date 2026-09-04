import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { SuggestionCombinedResponseDto } from '@/lib/api/generated/data-contracts';

import { useAppConfig } from '../use-app-config';
import { getSearchSuggestions } from '../../services/search-suggestions-service';

const EMPTY_SUGGESTIONS: SuggestionCombinedResponseDto = {
  taxonomies: [],
  organizations: [],
};

/**
 * Fetches both the taxonomies and organizations autocomplete groups in one
 * request. Always returns both arrays regardless of tenant flags — callers
 * decide whether to render the organizations group (see
 * `enableOrganizationSearch` in `search-bar.tsx`).
 */
export function useSearchSuggestions(searchTerm: string = '') {
  const appConfig = useAppConfig();
  const { i18n } = useTranslation();

  const { data } = useQuery({
    queryKey: ['search-suggestions', i18n.language, searchTerm],
    queryFn: async () => {
      if (!i18n.language || searchTerm.length === 0) {
        return EMPTY_SUGGESTIONS;
      }

      return getSearchSuggestions(searchTerm, {
        locale: i18n.language,
        tenantId: appConfig.tenantId,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return data || EMPTY_SUGGESTIONS;
}
