import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { FormEvent, useCallback } from 'react';
import {
  searchCoordinatesAtom,
  userCoordinatesAtom,
} from '@/app/(app)/shared/store/search';
import { useAtomValue } from 'jotai';
import {
  AiClassificationScenario,
  AiPredictOption,
  predictSearchNeeds,
} from '@/app/(app)/shared/services/ai-classification-search-service';
import { AiAction } from '@/app/(app)/shared/components/search/search-dialog';
import { useNavigateClassicSearch } from './useNavigateClassicSearch';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { useMainSearchLayoutContext } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout-context';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import { useTranslation } from 'react-i18next';
import { useNavigateAiSearch } from './useNavigateAiSearch';

type Args = {
  activeAiAction: AiAction | null;
  setActiveAiAction: (action: AiAction | null) => void;
  setAiSearchScenario: (scenario: AiClassificationScenario | undefined) => void;
  setDialogOpen: ((open: boolean) => void) | undefined;
  setClarifyValidationError: (error: string) => void;
  setClarifyOptions: (options: AiPredictOption[]) => void;
  setSelectedClarifyCodes: (codes: string[]) => void;
  startTransition: (callback: () => void) => void;
};
export const useOnSearchSubmit = ({
  activeAiAction,
  setDialogOpen,
  setActiveAiAction,
  setClarifyValidationError,
  setAiSearchScenario,
  setClarifyOptions,
  setSelectedClarifyCodes,
  startTransition,
}: Args) => {
  const appConfig = useAppConfig();
  const { i18n } = useTranslation('common');
  const { search, setSearch } = useMainSearchLayoutContext();
  const requireUserLocation = useFlag('requireUserLocation');
  const navigateClassicSearch = useNavigateClassicSearch({
    setDialogOpen,
    startTransition,
  });
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const navigateAiSearch = useNavigateAiSearch({
    setDialogOpen,
    startTransition,
  });

  return useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (activeAiAction) {
        return;
      }

      if (search.queryType === 'link' && search.href) {
        const opensInNewTab = search.target === '_blank';
        setDialogOpen?.(false);

        if (opensInNewTab) {
          window.open(search.href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.assign(search.href);
        }

        return;
      }

      if (requireUserLocation && search.searchLocation.trim().length === 0) {
        setSearch((prev) => ({
          ...prev,
          searchLocationValidationError: 'Address is required.',
        }));
        return;
      }

      const locationPayload = await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
      );

      const query = (search.query || search.searchTerm || '').trim();
      if (
        appConfig.search.searchEngine !== 'ai_classification' ||
        search.queryType === 'taxonomy' ||
        !query
      ) {
        await navigateClassicSearch(locationPayload);
        return;
      }

      setActiveAiAction('predict');
      setClarifyValidationError('');

      const predictResponse = await predictSearchNeeds(
        { query },
        i18n.language,
        appConfig.tenantId,
      );

      setActiveAiAction(null);

      if (!predictResponse) {
        await navigateClassicSearch(locationPayload);
        return;
      }

      const scenario = predictResponse.scenario;
      setAiSearchScenario(scenario);

      if (
        [
          'search',
          'search_and_notify_low_confidence',
          'search_and_notify_low_info',
        ].includes(scenario)
      ) {
        navigateAiSearch({
          taxonomies: predictResponse.hsis_taxonomies,
          scenario,
        });
        return;
      }

      const options = Array.isArray(predictResponse.options)
        ? predictResponse.options
        : [];
      setClarifyOptions(options);
      setSelectedClarifyCodes(
        options
          .filter((option) => option.pre_selected)
          .map((option) => option.code),
      );
    },
    [
      appConfig.search.searchEngine,
      appConfig.tenantId,
      activeAiAction,
      navigateAiSearch,
      navigateClassicSearch,
      requireUserLocation,
      i18n.language,
      search.query,
      search.href,
      search.searchLocation,
      search.searchTerm,
      search.target,
      search.queryType,
      searchCoordinates,
      setSearch,
      setDialogOpen,
      setClarifyValidationError,
      setAiSearchScenario,
      userCoordinates,
    ],
  );
};
