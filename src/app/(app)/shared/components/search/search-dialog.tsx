'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
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
  buildAiSearchUrl,
  normalizeHsisTaxonomies,
} from '../../utils/ai-search';
import { createUrlParamsForSearch } from '../../utils/createUrlParamsForSearch';
import { AiClassificationOptions } from './ai-classification-options';
import { LocationSearchBar } from './location-search-bar';
import { NEED_CODES } from './search-dialog-constants';
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
  const [isPredictLoading, setIsPredictLoading] = useState(false);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [clarifyVisible, setClarifyVisible] = useState(false);
  const [clarifyOptions, setClarifyOptions] = useState<AiPredictOption[]>([]);
  const [aiSearchScenario, setAiSearchScenario] =
    useState<AiClassificationScenario>();
  const [selectedClarifyCodes, setSelectedClarifyCodes] = useState<string[]>(
    [],
  );
  const [clarifyValidationError, setClarifyValidationError] = useState('');

  const allNeedCodes = useMemo(() => [...NEED_CODES], []);

  const clearAiState = useCallback(() => {
    setClarifyVisible(false);
    setClarifyOptions([]);
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
              (appConfig.search.hybridSemanticSearchEnabled
                ? 'hybrid'
                : 'text'),
          },
          appConfig.search.hybridSemanticSearchEnabled,
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
      appConfig.search.hybridSemanticSearchEnabled,
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
        return;
      }

      const url = buildAiSearchUrl({
        scenario,
        query,
        queryLabel: search.queryLabel,
        taxonomies,
      });

      persistSearchDistancePreference(distance);
      setOpen?.(false);
      router.push(url);
    },
    [
      distance,
      router,
      search.query,
      search.queryLabel,
      search.searchTerm,
      setOpen,
    ],
  );

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (isPredictLoading || isSkipLoading || isConfirmLoading) {
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

      if (!appConfig.search.aiClassificationEnabled) {
        await navigateClassicSearch(locationPayload);
        return;
      }

      const query = (search.query || search.searchTerm || '').trim();
      if (!query) {
        await navigateClassicSearch(locationPayload);
        return;
      }

      setIsPredictLoading(true);
      setClarifyValidationError('');

      const predictResponse = await predictSearchNeeds(
        { query },
        i18n.language,
        appConfig.tenantId,
      );

      setIsPredictLoading(false);

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
      setClarifyVisible(true);
    },
    [
      appConfig.search.aiClassificationEnabled,
      appConfig.tenantId,
      isConfirmLoading,
      isPredictLoading,
      isSkipLoading,
      navigateAiSearch,
      navigateClassicSearch,
      requireUserLocation,
      search.query,
      search.searchLocation,
      search.searchTerm,
      searchCoordinates,
      setSearch,
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
    if (isPredictLoading || isConfirmLoading || isSkipLoading) {
      return;
    }

    setIsSkipLoading(true);
    try {
      await Promise.resolve();
      navigateAiSearch();
    } finally {
      setIsSkipLoading(false);
    }
  }, [isConfirmLoading, isPredictLoading, isSkipLoading, navigateAiSearch]);

  const handleConfirmClarify = useCallback(async () => {
    if (isPredictLoading || isConfirmLoading || isSkipLoading) {
      return;
    }

    if (selectedClarifyCodes.length === 0) {
      setClarifyValidationError(t('search.ai_validation_select_or_skip'));
      return;
    }

    const optionsByCode = new Map(
      clarifyOptions.map((option) => [option.code, option]),
    );

    const needWeightsEntries = new Map<string, number>();

    for (const option of clarifyOptions) {
      const isSelected = selectedClarifyCodes.includes(option.code);

      if (isSelected) {
        if (option.pre_selected) {
          if (
            typeof option.score === 'number' &&
            Number.isFinite(option.score)
          ) {
            needWeightsEntries.set(option.code, option.score);
          }
        } else {
          needWeightsEntries.set(option.code, 0.6);
        }
      } else if (option.pre_selected) {
        needWeightsEntries.set(option.code, 0.1);
      }
    }

    for (const code of selectedClarifyCodes) {
      if (needWeightsEntries.has(code)) {
        continue;
      }

      const option = optionsByCode.get(code);
      if (!option) {
        needWeightsEntries.set(code, 0.6);
      }
    }

    const need_weights = Object.fromEntries(
      [...needWeightsEntries.entries()].filter(
        ([, value]) => typeof value === 'number' && Number.isFinite(value),
      ),
    );

    if (Object.keys(need_weights).length === 0) {
      setClarifyValidationError(t('search.ai_validation_select_or_skip'));
      return;
    }

    setClarifyValidationError('');
    setIsConfirmLoading(true);

    const reRankResponse = await reRankSearchNeeds(
      { need_weights },
      i18n.language,
      appConfig.tenantId,
    );

    setIsConfirmLoading(false);

    if (!reRankResponse) {
      toast.error(t('message.error'));
      return;
    }

    const rerankedTaxonomies = normalizeHsisTaxonomies(
      reRankResponse.hsis_taxonomies,
    );
    navigateAiSearch({ taxonomies: rerankedTaxonomies });
  }, [
    appConfig.tenantId,
    clarifyOptions,
    isConfirmLoading,
    isPredictLoading,
    isSkipLoading,
    navigateAiSearch,
    selectedClarifyCodes,
    t,
    i18n.language,
  ]);

  const isMainSearchLoading = isPredictLoading || isPending;
  const disableSearchControls =
    isPredictLoading || isConfirmLoading || isSkipLoading;
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
                isSkipLoading={isSkipLoading}
                isConfirmLoading={isConfirmLoading}
                onClose={closeDialog}
                onSkipClarify={handleSkipClarify}
                onConfirmClarify={handleConfirmClarify}
              />
            </div>
            <div id="search-form-inputs" className="overflow-y-auto">
              <SearchBar
                inputId={SEARCH_INPUT_ID}
                hideOptions={clarifyVisible}
                onQueryInputChange={handleSearchInputChange}
              />
              <LocationSearchBar inputId={LOCATION_INPUT_ID} className="mt-4" />

              {clarifyVisible && (
                <>
                  <AiClassificationOptions
                    allNeedCodes={allNeedCodes}
                    selectedCodes={selectedClarifyCodes}
                    options={clarifyOptions}
                    scenario={aiSearchScenario}
                    onToggle={handleToggleClarifyCode}
                    validationMessage={clarifyValidationError}
                    disabled={disableSearchControls}
                  />
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>,
    document.querySelector('#app-root') as Element,
  );
}
