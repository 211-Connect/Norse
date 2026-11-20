'use client';

import {
  autoUpdate,
  flip,
  type Middleware,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Loader2Icon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/(app)/shared/lib/utils';

import { Button } from '../button';
import { Input } from '../input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../tooltip';
import { AutocompleteListbox } from './autocomplete-listbox';
import {
  belowListMaxHeight,
  listMiddlewareNames,
  MIN_LIST_SPACE_PX,
} from './placement';
import { AutocompleteProps } from './types';
import { useAutocomplete } from './use-autocomplete';

/** For lists floating over other content (e.g. inside a dialog). */
export const FLOATING_LISTBOX_CLASSNAME =
  'rounded-md border mt-0 p-1 shadow-lg';

/** Gap between the input (or anchor) and the list. */
const LIST_OFFSET_PX = 8;
/** Space kept free between the list and the viewport edge. */
const VIEWPORT_PADDING_PX = 8;

const middlewareByName: Record<string, () => Middleware> = {
  offset: () => offset(LIST_OFFSET_PX),
  flip: () => flip({ padding: VIEWPORT_PADDING_PX }),
  shift: () => shift({ padding: VIEWPORT_PADDING_PX }),
  size: () =>
    size({
      padding: VIEWPORT_PADDING_PX,
      apply({ rects, availableHeight, elements }) {
        Object.assign(elements.floating.style, {
          width: `${rects.reference.width}px`,
          maxHeight: `${Math.max(0, availableHeight)}px`,
        });
      },
    }),
};

/**
 * Text input with a suggestion list (WAI-ARIA combobox). Behavior lives in
 * `useAutocomplete`; this component wires it to the markup and positions
 * the list with Floating UI.
 *
 * The list renders inside the component (not in a portal), so inside a
 * dialog it is clipped by the dialog's overflow — give such dialogs room
 * or `overflow-visible`, and see `keepDialogOpenWhileAutocompleteIsOpen`.
 */
export function Autocomplete({
  readerLabel,
  Icon,
  inputProps,
  options = [],
  className,
  onInputChange,
  onCommit,
  onClear,
  value,
  autoSelectIndex,
  autoSelectOnBlurIndex,
  defaultOpen,
  clearButtonLabel = 'Clear',
  clearButtonTooltip = true,
  positionBelowElementId,
  wrapperTestId,
  blockMode,
  onDecommit,
  onEscape,
  loading = false,
  listboxClassName,
  placement = 'auto',
  waitForOptions = false,
}: AutocompleteProps) {
  const { t } = useTranslation('common');
  const labelId = useId();
  const fallbackInputId = useId();
  const inputId = inputProps?.id ?? fallbackInputId;

  const autocomplete = useAutocomplete({
    options,
    value,
    defaultOpen,
    blockMode,
    autoSelectIndex,
    autoSelectOnBlurIndex,
    onInputChange,
    onCommit,
    onClear,
    onDecommit,
    onEscape,
    loading,
    waitForOptions,
  });
  const { open, activeIndex, inputText, listboxId, refs } = autocomplete;

  const { floatingStyles, refs: floatingRefs } = useFloating({
    open,
    placement: 'bottom-start',
    // `fixed` lets a list anchored to an outside element escape the input's
    // own layout box. A `below` list also uses it: it must not be clipped by a card that
    // scrolls or hides overflow.
    strategy:
      positionBelowElementId || placement === 'below' ? 'fixed' : 'absolute',
    whileElementsMounted: autoUpdate,
    middleware: listMiddlewareNames(placement).map((name) =>
      middlewareByName[name](),
    ),
  });

  // A `below` list never flips, so with little room under the input, bring the input to the
  // top of its scroller when the list opens.
  useEffect(() => {
    if (!open || placement !== 'below') return;
    const input = refs.inputRef.current;
    if (!input) return;
    const space = window.innerHeight - input.getBoundingClientRect().bottom;
    if (space < MIN_LIST_SPACE_PX) input.scrollIntoView({ block: 'start' });
  }, [open, placement, refs.inputRef]);

  // A `below` list sits in the flow under the input: a card around it grows with it instead of
  // cutting it off (live walk 2026-11-20: "Syracuse" needed scrolling inside a short list).
  const inFlowList = placement === 'below' && !positionBelowElementId;
  const [belowMaxHeight, setBelowMaxHeight] = useState<number>();
  useEffect(() => {
    if (!open || !inFlowList) return;
    const measure = () => {
      const input = refs.inputRef.current;
      if (!input) return;
      const visible = window.visualViewport?.height ?? window.innerHeight;
      setBelowMaxHeight(
        belowListMaxHeight(visible, input.getBoundingClientRect().bottom),
      );
    };
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [open, inFlowList, refs.inputRef]);

  useEffect(() => {
    if (positionBelowElementId) {
      floatingRefs.setReference(
        document.getElementById(positionBelowElementId),
      );
    }
  }, [positionBelowElementId, floatingRefs]);

  const setInputElement = useCallback(
    (element: HTMLInputElement | null) => {
      refs.inputRef.current = element;
      if (!positionBelowElementId) {
        floatingRefs.setReference(element);
      }
    },
    [refs.inputRef, positionBelowElementId, floatingRefs],
  );

  const setListboxElement = useCallback(
    (element: HTMLDivElement | null) => {
      refs.listboxRef.current = element;
      // An in-flow list is not positioned by Floating UI (its `size` step would set the height).
      floatingRefs.setFloating(inFlowList ? null : element);
    },
    [refs.listboxRef, floatingRefs, inFlowList],
  );

  const hasText = inputText.length > 0;
  const hasOptions = autocomplete.optionCount > 0;
  // Only shown when there is something to show: options, or a loading row.
  const isListVisible = open && (hasOptions || loading);

  const statusMessage = !open
    ? ''
    : hasOptions
      ? t('autocomplete.results_available', {
          count: autocomplete.optionCount,
        })
      : loading
        ? t('autocomplete.loading')
        : t('autocomplete.no_results');

  const listbox = (
    <AutocompleteListbox
      id={listboxId}
      ref={setListboxElement}
      groups={autocomplete.groups}
      activeIndex={activeIndex}
      highlightText={autocomplete.typedText}
      optionId={autocomplete.optionId}
      loading={loading}
      loadingLabel={t('autocomplete.loading')}
      className={cn(listboxClassName, inFlowList && 'relative basis-full')}
      style={inFlowList ? { maxHeight: belowMaxHeight } : floatingStyles}
      {...autocomplete.listHandlers}
    />
  );

  return (
    <div
      className={cn(
        'relative flex items-center',
        // An in-flow list goes on its own line under the input.
        inFlowList && 'flex-wrap',
        className,
      )}
      ref={refs.wrapperRef}
      data-testid={wrapperTestId}
    >
      <div className="relative w-full rounded-lg">
        <label className="sr-only" htmlFor={inputId} id={labelId}>
          {readerLabel}
        </label>
        <Icon
          className="text-primary absolute top-2 left-2 size-4 shrink-0"
          aria-hidden="true"
        />
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </div>
        {/* Keeps `aria-controls` pointing at an element while closed. */}
        {!isListVisible && (
          <div id={listboxId} role="listbox" hidden aria-hidden />
        )}

        <Input
          {...inputProps}
          {...autocomplete.inputHandlers}
          id={inputId}
          ref={setInputElement}
          className={cn(
            'border-control-border focus:border-primary h-auto w-full rounded-lg border p-0 px-[1.8rem] py-2 text-xs shadow-none focus-visible:ring-0',
            inputProps?.className,
            // Room for the spinner next to the clear button.
            loading && hasText && 'pr-16',
          )}
          value={inputText}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-expanded={isListVisible}
          aria-busy={loading}
          aria-labelledby={labelId}
          aria-activedescendant={
            activeIndex === -1 ? undefined : autocomplete.optionId(activeIndex)
          }
        />

        {loading && (
          <Loader2Icon
            className={cn(
              'text-muted-foreground absolute top-1/2 size-4 -translate-y-1/2 animate-spin',
              hasText ? 'right-9' : 'right-2',
            )}
            aria-hidden="true"
            data-testid="autocomplete-loading"
          />
        )}

        {hasText && !clearButtonTooltip && (
          <Button
            ref={refs.clearButtonRef}
            size="icon"
            variant="ghost"
            className="absolute top-0 right-0 h-full hover:bg-transparent hover:bg-none"
            onClick={autocomplete.clear}
            aria-label={clearButtonLabel}
            data-testid="search-clear-btn"
            type="button"
          >
            <XIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
        {hasText && clearButtonTooltip && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild autoFocus={false}>
                <Button
                  ref={refs.clearButtonRef}
                  size="icon"
                  variant="ghost"
                  className="absolute top-0 right-0 h-full hover:bg-transparent hover:bg-none"
                  onClick={autocomplete.clear}
                  aria-label={clearButtonLabel}
                  data-testid="search-clear-btn"
                  type="button"
                >
                  <XIcon className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span>{clearButtonLabel}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isListVisible && !inFlowList && listbox}
      </div>
      {isListVisible && inFlowList && listbox}
    </div>
  );
}

/**
 * For a Dialog containing an Autocomplete: pass as the dialog content's
 * `onEscapeKeyDown`, so the first Escape closes an open suggestion list and
 * only a second one closes the dialog. (Radix handles Escape before the
 * input sees it.)
 */
export function keepDialogOpenWhileAutocompleteIsOpen(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;

  if (
    target?.getAttribute('role') === 'combobox' &&
    target.getAttribute('aria-expanded') === 'true'
  ) {
    event.preventDefault();
  }
}
