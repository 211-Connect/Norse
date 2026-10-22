'use client';

import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Loader2Icon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useId } from 'react';
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
import { AutocompleteProps } from './types';
import { useAutocomplete } from './use-autocomplete';

/** For lists floating over other content (e.g. inside a dialog). */
export const FLOATING_LISTBOX_CLASSNAME =
  'rounded-md border mt-0 p-1 shadow-lg';

/** Gap between the input (or anchor) and the list. */
const LIST_OFFSET_PX = 8;
/** Space kept free between the list and the viewport edge. */
const VIEWPORT_PADDING_PX = 8;

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
  positionBelowElementId,
  wrapperTestId,
  blockMode,
  onDecommit,
  onEscape,
  loading = false,
  listboxClassName,
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
  });
  const { open, activeIndex, inputText, listboxId, refs } = autocomplete;

  const { floatingStyles, refs: floatingRefs } = useFloating({
    open,
    placement: 'bottom-start',
    // `fixed` lets a list anchored to an outside element escape the input's
    // own layout box.
    strategy: positionBelowElementId ? 'fixed' : 'absolute',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(LIST_OFFSET_PX),
      flip({ padding: VIEWPORT_PADDING_PX }),
      shift({ padding: VIEWPORT_PADDING_PX }),
      size({
        padding: VIEWPORT_PADDING_PX,
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${Math.max(0, availableHeight)}px`,
          });
        },
      }),
    ],
  });

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
      floatingRefs.setFloating(element);
    },
    [refs.listboxRef, floatingRefs],
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

  return (
    <div
      className={cn('relative flex items-center', className)}
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

        {hasText && (
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

        {isListVisible && (
          <AutocompleteListbox
            id={listboxId}
            ref={setListboxElement}
            groups={autocomplete.groups}
            activeIndex={activeIndex}
            highlightText={autocomplete.typedText}
            optionId={autocomplete.optionId}
            loading={loading}
            loadingLabel={t('autocomplete.loading')}
            className={listboxClassName}
            style={floatingStyles}
            {...autocomplete.listHandlers}
          />
        )}
      </div>
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
