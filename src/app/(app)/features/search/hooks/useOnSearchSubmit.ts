import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { FormEvent, TransitionStartFunction, useCallback } from 'react';
import { initialTransition, transition } from 'xstate';
import { searchIntent } from '@/app/(app)/features/search/intent';
import {
  searchPolicy,
  searchResolverMachine,
} from '@/app/(app)/features/search/resolver';
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
  startTransition: TransitionStartFunction;
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

      const query = (search.query || search.searchTerm || '').trim();
      // The resolver routes the submit; this hook performs what it decides.
      const [resting] = initialTransition(searchResolverMachine, {
        intent: searchIntent({}),
        loopGuard: true,
        policy: searchPolicy({
          searchEngine: appConfig.search.searchEngine,
          requireUserLocation,
        }),
        searchEngine: appConfig.search.searchEngine,
      });
      let [routed] = transition(searchResolverMachine, resting, {
        type: 'SUBMIT',
        submission: {
          query,
          queryType: search.queryType,
          organizationId: search.organizationId,
          href: search.href,
          target: search.target,
          location: search.searchLocation,
        },
      });

      if (routed.value === 'following_link') {
        const opensInNewTab = search.target === '_blank';
        setDialogOpen?.(false);

        if (opensInNewTab) {
          window.open(search.href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.assign(search.href);
        }

        return;
      }

      if (routed.value === 'location_required') {
        setSearch((prev) => ({
          ...prev,
          searchLocationValidationError: 'Address is required.',
        }));
        return;
      }

      if (routed.value === 'navigating_classic') {
        startTransition(async () => {
          const locationPayload = await buildSearchLocationPayload(
            searchCoordinates,
            userCoordinates,
            appConfig.tenantId,
          );
          await navigateClassicSearch(locationPayload);
        });
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
      [routed] = transition(searchResolverMachine, routed, {
        type: 'PREDICTION_RESOLVED',
        prediction: predictResponse,
      });

      if (routed.value === 'navigating_classic') {
        const locationPayload = await buildSearchLocationPayload(
          searchCoordinates,
          userCoordinates,
          appConfig.tenantId,
        );
        await navigateClassicSearch(locationPayload);
        return;
      }

      setAiSearchScenario(routed.context.scenario);

      if (routed.value === 'navigating_ai') {
        const locationPayload = await buildSearchLocationPayload(
          searchCoordinates,
          userCoordinates,
          appConfig.tenantId,
        );
        navigateAiSearch({
          taxonomies: predictResponse?.hsis_taxonomies,
          scenario: routed.context.scenario,
          locationPayload,
        });
        return;
      }

      setClarifyOptions(routed.context.clarifyOptions ?? []);
      setSelectedClarifyCodes(routed.context.selectedCodes);
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
      search.organizationId,
      searchCoordinates,
      setSearch,
      setDialogOpen,
      setClarifyValidationError,
      setAiSearchScenario,
      userCoordinates,
    ],
  );
};
