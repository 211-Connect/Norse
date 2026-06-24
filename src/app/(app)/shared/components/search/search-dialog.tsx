'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import {
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '../../hooks/use-app-config';
import { useFlag } from '../../hooks/use-flag';
import {
  LOCATION_INPUT_ID,
  SEARCH_DIALOG_DESCRIPTION_ID,
  SEARCH_DIALOG_ID,
  SEARCH_DIALOG_TITLE_ID,
  SEARCH_INPUT_ID,
} from '../../lib/constants';
import { buildSearchLocationPayload } from '../../lib/search-location-meta';
import { persistSearchDistancePreference } from '../../lib/search-distance-preference';
import { UmamiEvent, trackUmamiEvent } from '../../lib/umami';
import { cn, getScrollbarWidth } from '../../lib/utils';
import {
  AiClassificationScenario,
  AiPredictOption,
  predictSearchNeeds,
  reRankSearchNeeds,
} from '../../services/ai-classification-search-service';
import {
  searchCoordinatesAtom,
  searchDistanceAtom,
  userCoordinatesAtom,
} from '../../store/search';
import {
  buildAiNeedWeights,
  buildAiSearchUrl,
  normalizeHsisTaxonomies,
} from '../../utils/ai-search';
import { createUrlParamsForSearch } from '../../utils/createUrlParamsForSearch';
import { AiClassificationOptions } from './ai-classification-options';
import { LocationSearchBar } from './location-search-bar';
import { SearchDialogHeaderActions } from './search-dialog-header-actions';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';
import { SearchBar } from './search-bar';

export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  open: boolean;
  setOpen?: (open: boolean) => void;
  restoreFocusElement?: HTMLElement | null;
}

export function SearchDialog({
  focusByDefault = 'search',
  open,
  setOpen,
  restoreFocusElement,
}: SearchDialogProps) {
  const { t, i18n } = useTranslation('common');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const appConfig = useAppConfig();
  const requireUserLocation = useFlag('requireUserLocation');
  const scrollPositionRef = useRef(0);
  const initialRenderRef = useRef(true);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const distance = useAtomValue(searchDistanceAtom);
  const { search, setSearch } = useMainSearchLayoutContext();
  const setUserCoordinates = useSetAtom(userCoordinatesAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const [aiSearchScenario, setAiSearchScenario] =
    useState<AiClassificationScenario>();
  const [activeAiAction, setActiveAiAction] = useState<
    'predict' | 'skip' | 'confirm' | null
  >(null);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [clarifyOptions, setClarifyOptions] = useState<
    AiPredictOption[] | null
  >(null);
  const [selectedClarifyCodes, setSelectedClarifyCodes] = useState<string[]>(
    [],
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

  const navigateClassicSearch = useCallback(
    async (locationPayload: Record<string, unknown>) => {
      startTransition(() => {
        const query = search.query || search.searchTerm;

        const hasCoordinates = search.searchCoordinates.length === 2;
        const locationParams = hasCoordinates
          ? {
              searchLocation: search.searchLocation,
              searchCoordinates: search.searchCoordinates,
            }
          : {};

        const urlParams = createUrlParamsForSearch(
          {
            ...search,
            ...locationParams,
            query: query || '',
            queryType:
              search.queryType ||
              (appConfig.search.searchEngine === 'hybrid' ? 'hybrid' : 'text'),
          },
          appConfig.search.searchEngine,
        );

        const queryParams = new URLSearchParams(urlParams).toString();
        persistSearchDistancePreference(distance);

        const effectiveQueryType = search.queryType;

        const umamiPayload = {
          query: String(query ?? ''),
          queryLabel: String(search.queryLabel ?? ''),
          tenantId: appConfig.tenantId ?? '',
          ...locationPayload,
        };

        if (effectiveQueryType === 'text') {
          trackUmamiEvent(UmamiEvent.SearchText, umamiPayload);
        }

        if (effectiveQueryType === 'taxonomy') {
          trackUmamiEvent(UmamiEvent.SearchTaxonomy, umamiPayload);
        }

        setOpen?.(false);
        router.push(`/search${queryParams ? `?${queryParams}` : ''}`);

        setSearch((prev) => ({
          ...prev,
          ...locationParams,
        }));
      });
    },
    [
      appConfig.search.searchEngine,
      appConfig.tenantId,
      distance,
      router,
      search,
      setOpen,
      setSearch,
      startTransition,
    ],
  );

  const navigateAiSearch = useCallback(
    ({
      scenario,
      taxonomies,
    }: {
      scenario?: AiClassificationScenario;
      taxonomies?: string[];
    } = {}) => {
      const query = (search.query || search.searchTerm || '').trim();
      if (!query) {
        return false;
      }

      const url = buildAiSearchUrl({
        scenario,
        query,
        queryLabel: search.queryLabel,
        taxonomies,
      });

      persistSearchDistancePreference(distance);
      startTransition(() => {
        setOpen?.(false);
        router.push(url);
      });

      return true;
    },
    [
      distance,
      router,
      search.query,
      search.queryLabel,
      search.searchTerm,
      setOpen,
      startTransition,
    ],
  );

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (activeAiAction) {
        return;
      }

      if (search.queryType === 'link' && search.href) {
        const opensInNewTab = search.target === '_blank';
        setOpen?.(false);

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

      const taxonomies = normalizeHsisTaxonomies(
        predictResponse.hsis_taxonomies,
      );

      if (predictResponse.scenario === 'search') {
        navigateAiSearch({ taxonomies });
        return;
      }

      if (
        scenario === 'search_and_notify_low_confidence' ||
        scenario === 'search_and_notify_low_info'
      ) {
        navigateAiSearch({ taxonomies, scenario });
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
      setOpen,
      userCoordinates,
    ],
  );

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

    const rerankedTaxonomies = normalizeHsisTaxonomies(
      reRankResponse.hsis_taxonomies,
    );
    navigateAiSearch({ taxonomies: rerankedTaxonomies });
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

  useEffect(() => {
    if (!open || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoordinates([pos.coords.longitude, pos.coords.latitude]);
      },
      () => {
        setUserCoordinates(searchCoordinates);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, [open, setUserCoordinates, searchCoordinates]);

  useEffect(() => {
    if (initialRenderRef.current) return;

    if (open) {
      const elementToSelect =
        focusByDefault === 'location' ? LOCATION_INPUT_ID : SEARCH_INPUT_ID;

      const scrollbarWidth = getScrollbarWidth();
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      setTimeout(() => {
        (
          document.querySelector(`#${elementToSelect}`) as
            | HTMLInputElement
            | undefined
        )?.focus();
      }, 100);
    } else {
      setTimeout(() => {
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.position = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollPositionRef.current || 0);
      }, 10);
    }
  }, [focusByDefault, open]);

  const closeDialog = useCallback(() => {
    setOpen?.(false);

    if (restoreFocusElement) {
      setTimeout(() => {
        restoreFocusElement.focus({ preventScroll: true });
      }, 20);
    }
  }, [restoreFocusElement, setOpen]);

  const handleDialogKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter((element) => {
        return (
          element.getAttribute('aria-hidden') !== 'true' &&
          !element.hasAttribute('disabled') &&
          element.tabIndex !== -1
        );
      });

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    },
    [closeDialog],
  );

  useEffect(() => {
    initialRenderRef.current = false;
    setMounted(true);

    return () => {
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.position = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, 0);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={dialogRef}
      id={SEARCH_DIALOG_ID}
      className={cn(
        'fixed top-0 right-0 bottom-0 left-0 z-50 overflow-y-auto overscroll-contain bg-white p-6 transition-opacity duration-300',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      role="dialog"
      data-testid={SEARCH_DIALOG_ID}
      aria-hidden={open ? undefined : true}
      aria-modal={open ? true : undefined}
      aria-labelledby={SEARCH_DIALOG_TITLE_ID}
      aria-describedby={SEARCH_DIALOG_DESCRIPTION_ID}
      onKeyDown={handleDialogKeyDown}
    >
      <h2 className="sr-only" id={SEARCH_DIALOG_TITLE_ID}>
        {t('header.search')}
      </h2>
      <p className="sr-only" id={SEARCH_DIALOG_DESCRIPTION_ID}>
        {t('search.search_dialog_description')}
      </p>
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
              <LocationSearchBar inputId={LOCATION_INPUT_ID} className="mt-4" />

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
    </div>,
    document.querySelector('#app-root') as Element,
  );
}
