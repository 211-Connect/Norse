'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useMachine } from '@xstate/react';
import {
  FocusEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '../../hooks/use-app-config';
import { useFlag } from '../../hooks/use-flag';
import {
  LOCATION_INPUT_ID,
  SEARCH_DIALOG_ID,
  SEARCH_INPUT_ID,
} from '../../lib/constants';
import { cn } from '../../lib/utils';
import {
  AiClassificationScenario,
  AiPredictOption,
  reRankSearchNeeds,
} from '../../services/ai-classification-search-service';
import { buildAiNeedWeights } from '../../../features/search/utils/buildAiNeedWeights';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import { useAtomValue } from 'jotai';
import {
  searchCoordinatesAtom,
  userCoordinatesAtom,
} from '@/app/(app)/shared/store/search';
import { AiClassificationOptions } from './ai-classification-options';
import { LocationSearchBar } from './location-search-bar';
import { SearchDialogHeaderActions } from './search-dialog-header-actions';
import { SearchBar } from './search-bar';
import {
  useNavigateAiSearch,
  useUserLocationNavigator,
} from '@/app/(app)/features/search/hooks';
import { useOnSearchSubmit } from '@/app/(app)/features/search/hooks/useOnSearchSubmit';
import {
  searchIntent,
  type SearchIntent,
} from '@/app/(app)/features/search/intent';
import {
  searchPolicy,
  searchResolverMachine,
} from '@/app/(app)/features/search/resolver';

export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  /** The search page's intent: a URL carrying clarify state opens with its options. */
  intent?: SearchIntent;
  onLegacyAiClarifyAction?: () => void;
  open: boolean;
  setOpen?: (open: boolean) => void;
  restoreFocusElement?: HTMLElement | null;
}

/** The dialog's busy states, as `useOnSearchSubmit` reports and reads them. */
export type AiAction = 'predict' | 'skip' | 'confirm';

/** The effects the dialog's resolver actor performs, read through a ref so they are never stale. */
type DialogEffects = {
  clarifyActed: () => void;
  /** Resolves false when there was nothing to navigate to. */
  navigateSkipped: () => Promise<boolean>;
  rerank: (
    options: AiPredictOption[],
    codes: string[],
  ) => Promise<string[] | null>;
  navigateConfirmed: (taxonomies: string[]) => Promise<void>;
  notifyRerankFailed: () => void;
};

export function SearchDialog({
  focusByDefault = 'search',
  intent,
  onLegacyAiClarifyAction,
  open,
  setOpen,
  restoreFocusElement,
}: SearchDialogProps) {
  const { t, i18n } = useTranslation('common');
  const [isPending, startTransition] = useTransition();
  const appConfig = useAppConfig();

  const requireUserLocation = useFlag('requireUserLocation');
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const [isLocationActive, setIsLocationActive] = useState(false);

  const navigateAiSearch = useNavigateAiSearch({
    setDialogOpen: setOpen,
    startTransition,
  });

  /** Where the visitor searched, for the search analytics event. */
  const locationPayload = () =>
    buildSearchLocationPayload(
      searchCoordinates,
      userCoordinates,
      appConfig.tenantId,
    );

  const effects = useRef<DialogEffects | null>(null);
  effects.current = {
    clarifyActed: () => onLegacyAiClarifyAction?.(),
    navigateSkipped: async () =>
      navigateAiSearch({ locationPayload: await locationPayload() }),
    rerank: async (options, codes) => {
      const reRankResponse = await reRankSearchNeeds(
        { need_weights: buildAiNeedWeights(options, codes) },
        i18n.language,
        appConfig.tenantId,
      );
      return reRankResponse ? reRankResponse.hsis_taxonomies : null;
    },
    navigateConfirmed: async (taxonomies) => {
      navigateAiSearch({
        taxonomies,
        locationPayload: await locationPayload(),
      });
    },
    notifyRerankFailed: () => {
      toast.error(t('message.error'));
    },
  };

  const [dialogMachine] = useState(() =>
    searchResolverMachine.provide({
      actions: {
        clarifyActed: () => effects.current?.clarifyActed(),
        navigateSkipped: ({ self }) => {
          // A tick first, so the skip button shows its loading state before navigating.
          void Promise.resolve().then(async () => {
            if (!(await effects.current?.navigateSkipped())) {
              self.send({ type: 'NAVIGATION_REFUSED' });
            }
          });
        },
        requestRerank: ({ context, self }) => {
          void effects.current
            ?.rerank(context.clarifyOptions ?? [], context.selectedCodes)
            .then((taxonomies) =>
              self.send({ type: 'RERANK_RESOLVED', taxonomies }),
            );
        },
        navigateConfirmed: (_, { taxonomies }) => {
          void effects.current?.navigateConfirmed(taxonomies);
        },
        notifyRerankFailed: () => effects.current?.notifyRerankFailed(),
      },
    }),
  );
  const [resolver, send] = useMachine(dialogMachine, {
    input: {
      intent: intent ?? searchIntent({}),
      loopGuard: true,
      policy: searchPolicy({
        searchEngine: appConfig.search.searchEngine,
        requireUserLocation,
      }),
      searchEngine: appConfig.search.searchEngine,
    },
  });

  const activeAiAction: AiAction | null = resolver.matches('needs_prediction')
    ? 'predict'
    : resolver.matches('skipping')
      ? 'skip'
      : resolver.matches('confirming') || resolver.matches('confirmed')
        ? 'confirm'
        : null;
  const { clarifyOptions, selectedCodes, scenario, needsSelection } =
    resolver.context;
  const clarifyValidationError = needsSelection
    ? t('search.ai_validation_select_or_skip')
    : '';

  const clarifyVisible = clarifyOptions !== null;
  const effectiveClarifyOptions = clarifyOptions ?? [];
  const isPredictLoading = activeAiAction === 'predict';

  // `useOnSearchSubmit` routes the submit on the same machine and reports each step here.
  const onSubmit = useOnSearchSubmit({
    activeAiAction,
    setDialogOpen: setOpen,
    setActiveAiAction: useCallback(
      (action: AiAction | null) =>
        send(
          action === 'predict'
            ? { type: 'PREDICTION_REQUESTED' }
            : { type: 'PREDICTION_SETTLED' },
        ),
      [send],
    ),
    setClarifyValidationError: useCallback(
      () => send({ type: 'VALIDATION_CLEARED' }),
      [send],
    ),
    setAiSearchScenario: useCallback(
      (value: AiClassificationScenario | undefined) =>
        send({ type: 'SCENARIO_RESOLVED', scenario: value }),
      [send],
    ),
    setClarifyOptions: useCallback(
      (options: AiPredictOption[]) =>
        send({ type: 'OPTIONS_OFFERED', options }),
      [send],
    ),
    setSelectedClarifyCodes: useCallback(
      (codes: string[]) => send({ type: 'CODES_SELECTED', codes }),
      [send],
    ),
    startTransition,
  });

  const handleToggleClarifyCode = useCallback(
    (code: string) => send({ type: 'CODE_TOGGLED', code }),
    [send],
  );

  const handleSkipClarify = useCallback(
    () => send({ type: 'SKIPPED', pending: isPending }),
    [isPending, send],
  );

  const handleConfirmClarify = useCallback(
    () => send({ type: 'CONFIRMED', pending: isPending }),
    [isPending, send],
  );

  useEffect(() => {
    if (isPending) {
      return;
    }

    send({ type: 'NAVIGATION_SETTLED' });
  }, [isPending, send]);

  const isMainSearchLoading = isPredictLoading || isPending;
  const disableSearchControls = Boolean(activeAiAction) || isPending;
  const isSkipButtonLoading = activeAiAction === 'skip';
  const isConfirmButtonLoading = activeAiAction === 'confirm';
  const showAiClassificationOptions = clarifyVisible && !isLocationActive;

  const handleSearchFormFocusCapture = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.id === LOCATION_INPUT_ID) {
        setIsLocationActive(true);
        return;
      }

      if (target.id === SEARCH_INPUT_ID) {
        setIsLocationActive(false);
      }
    },
    [],
  );

  const handleSearchFormBlurCapture = useCallback(() => {
    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isLocationInputFocused = activeElement?.id === LOCATION_INPUT_ID;
      if (!isLocationInputFocused) {
        setIsLocationActive(false);
      }
    });
  }, []);

  const handleSearchInputChange = useCallback(
    () => send({ type: 'QUERY_EDITED' }),
    [send],
  );

  useUserLocationNavigator({ isDialogOpen: open });

  const closeDialog = useCallback(() => {
    onLegacyAiClarifyAction?.();
    setOpen?.(false);
  }, [onLegacyAiClarifyAction, setOpen]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        closeDialog();
      }
    },
    [closeDialog],
  );

  // Radix normally auto-focuses the dialog's first focusable element; we
  // preventDefault and focus the search/location input ourselves instead so
  // `focusByDefault` keeps deciding which field opens with focus.
  const handleOpenAutoFocus = useCallback(
    (event: Event) => {
      event.preventDefault();
      const elementId =
        focusByDefault === 'location' ? LOCATION_INPUT_ID : SEARCH_INPUT_ID;
      document.getElementById(elementId)?.focus();
    },
    [focusByDefault],
  );

  const handleCloseAutoFocus = useCallback(
    (event: Event) => {
      if (!restoreFocusElement) {
        return;
      }

      event.preventDefault();
      restoreFocusElement.focus({ preventScroll: true });
    },
    [restoreFocusElement],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          id={SEARCH_DIALOG_ID}
          data-testid={SEARCH_DIALOG_ID}
          aria-hidden={open ? undefined : true}
          aria-modal={open ? true : undefined}
          className={cn(
            'fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white p-6',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:pointer-events-none duration-300',
          )}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <DialogPrimitive.Title className="sr-only">
            {t('header.search')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t('search.search_dialog_description')}
          </DialogPrimitive.Description>
          <div className="flex min-h-full w-full max-w-full items-start justify-center rounded-none! border-0">
            {open && (
              <form
                onSubmit={onSubmit}
                className="flex w-full max-w-100 flex-col gap-4 overflow-y-auto pt-6 pb-6 [@media(min-width:640px)_and_(min-height:600px)]:pt-30"
              >
                <div className="flex flex-row justify-between gap-4">
                  <SearchDialogHeaderActions
                    clarifyVisible={clarifyVisible}
                    disableSearchControls={disableSearchControls}
                    isMainSearchLoading={isMainSearchLoading}
                    isSkipLoading={isSkipButtonLoading}
                    isConfirmLoading={isConfirmButtonLoading}
                    onClose={closeDialog}
                    onSkipClarify={handleSkipClarify}
                    onConfirmClarify={handleConfirmClarify}
                  />
                </div>
                <div
                  id="search-form-inputs"
                  className="overflow-y-auto"
                  onFocusCapture={handleSearchFormFocusCapture}
                  onBlurCapture={handleSearchFormBlurCapture}
                >
                  <SearchBar
                    inputId={SEARCH_INPUT_ID}
                    hideOptions={clarifyVisible}
                    onQueryInputChange={handleSearchInputChange}
                  />
                  <LocationSearchBar
                    inputId={LOCATION_INPUT_ID}
                    className="mt-4"
                  />

                  {showAiClassificationOptions && (
                    <AiClassificationOptions
                      selectedCodes={selectedCodes}
                      options={effectiveClarifyOptions}
                      onToggle={handleToggleClarifyCode}
                      scenario={scenario}
                      validationMessage={clarifyValidationError}
                      disabled={disableSearchControls}
                    />
                  )}
                </div>
              </form>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
