'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  FocusEvent,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '../../hooks/use-app-config';
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
import { AiClassificationOptions } from './ai-classification-options';
import { LocationSearchBar } from './location-search-bar';
import { SearchDialogHeaderActions } from './search-dialog-header-actions';
import { SearchBar } from './search-bar';
import {
  useNavigateAiSearch,
  useUserLocationNavigator,
} from '@/app/(app)/features/search/hooks';
import { useOnSearchSubmit } from '@/app/(app)/features/search/hooks/useOnSearchSubmit';

export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  initialAiState?: Partial<{
    scenario: AiClassificationScenario;
    clarifyOptions: AiPredictOption[];
    selectedClarifyCodes: string[];
  }>;
  onLegacyAiClarifyAction?: () => void;
  open: boolean;
  setOpen?: (open: boolean) => void;
  restoreFocusElement?: HTMLElement | null;
}

export type AiAction = 'predict' | 'skip' | 'confirm';

export function SearchDialog({
  focusByDefault = 'search',
  initialAiState,
  onLegacyAiClarifyAction,
  open,
  setOpen,
  restoreFocusElement,
}: SearchDialogProps) {
  const { t, i18n } = useTranslation('common');
  const [isPending, startTransition] = useTransition();
  const appConfig = useAppConfig();

  const [aiSearchScenario, setAiSearchScenario] = useState<
    AiClassificationScenario | undefined
  >(initialAiState?.scenario);
  const [activeAiAction, setActiveAiAction] = useState<AiAction | null>(null);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [clarifyOptions, setClarifyOptions] = useState<
    AiPredictOption[] | null
  >(
    initialAiState?.clarifyOptions && initialAiState.clarifyOptions.length > 0
      ? initialAiState.clarifyOptions
      : null,
  );
  const [selectedClarifyCodes, setSelectedClarifyCodes] = useState<string[]>(
    initialAiState?.selectedClarifyCodes ?? [],
  );
  const [clarifyValidationError, setClarifyValidationError] = useState('');

  const clarifyVisible = clarifyOptions !== null;
  const effectiveClarifyOptions = clarifyOptions ?? [];
  const isPredictLoading = activeAiAction === 'predict';

  const clearAiState = useCallback(() => {
    setClarifyOptions(null);
    setSelectedClarifyCodes([]);
    setClarifyValidationError('');
  }, []);

  const navigateAiSearch = useNavigateAiSearch({
    setDialogOpen: setOpen,
    startTransition,
  });
  const onSubmit = useOnSearchSubmit({
    activeAiAction,
    setDialogOpen: setOpen,
    setActiveAiAction,
    setClarifyValidationError,
    setAiSearchScenario,
    setClarifyOptions,
    setSelectedClarifyCodes,
    startTransition,
  });

  const handleToggleClarifyCode = useCallback((code: string) => {
    setClarifyValidationError('');
    setSelectedClarifyCodes((prev) =>
      prev.includes(code)
        ? prev.filter((value) => value !== code)
        : [...prev, code],
    );
  }, []);

  const handleSkipClarify = useCallback(async () => {
    if (activeAiAction || isPending) {
      return;
    }

    onLegacyAiClarifyAction?.();
    setActiveAiAction('skip');
    await Promise.resolve();
    const didNavigate = navigateAiSearch();
    if (!didNavigate) {
      setActiveAiAction(null);
    }
  }, [activeAiAction, isPending, navigateAiSearch]);

  const handleConfirmClarify = useCallback(async () => {
    if (activeAiAction || isPending) {
      return;
    }

    if (selectedClarifyCodes.length === 0) {
      setClarifyValidationError(t('search.ai_validation_select_or_skip'));
      return;
    }

    onLegacyAiClarifyAction?.();
    const needWeights = buildAiNeedWeights(
      effectiveClarifyOptions,
      selectedClarifyCodes,
    );

    if (Object.keys(needWeights).length === 0) {
      setClarifyValidationError(t('search.ai_validation_select_or_skip'));
      return;
    }

    setClarifyValidationError('');
    setActiveAiAction('confirm');

    const reRankResponse = await reRankSearchNeeds(
      { need_weights: needWeights },
      i18n.language,
      appConfig.tenantId,
    );

    if (!reRankResponse) {
      setActiveAiAction(null);
      toast.error(t('message.error'));
      return;
    }

    navigateAiSearch({ taxonomies: reRankResponse.hsis_taxonomies });
  }, [
    activeAiAction,
    appConfig.tenantId,
    effectiveClarifyOptions,
    isPending,
    navigateAiSearch,
    selectedClarifyCodes,
    t,
    i18n.language,
  ]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    setActiveAiAction(null);
  }, [isPending]);

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

  const handleSearchInputChange = useCallback(() => {
    if (!clarifyVisible) {
      return;
    }

    clearAiState();
  }, [clarifyVisible, clearAiState]);

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
                      selectedCodes={selectedClarifyCodes}
                      options={effectiveClarifyOptions}
                      onToggle={handleToggleClarifyCode}
                      scenario={aiSearchScenario}
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
