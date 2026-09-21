'use client';

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { XIcon } from 'lucide-react';
import {
  ChangeEvent,
  ComponentType,
  CompositionEvent,
  Fragment,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/(app)/shared/lib/utils';

import { useAppConfig } from '../../hooks/use-app-config';
import { useOnPointerDownOutside } from '../../hooks/use-on-pointer-down-outside';
import { Badge } from './badge';
import { Button } from './button';
import { Input, InputProps } from './input';
import { SELECT_INTERACTIVE_ACTIVE_CLASSNAME } from './select';
import { Separator } from './separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export type AutocompleteOption = {
  value: string;
  group?: string;
  Icon?: ComponentType<{ className?: string }>;
  badge?: string;
  query?: string;
  queryType?: string;
  organizationId?: string;
  href?: string;
  target?: '_self' | '_blank';
};

type AutocompleteOptionWithIndex = AutocompleteOption & { index: number };

const AUTOCOMPLETE_OPTION_ACTIVE_CLASSNAME =
  SELECT_INTERACTIVE_ACTIVE_CLASSNAME;

export type AutocompleteProps = {
  readerLabel: ReactNode;
  Icon: ComponentType<{ className?: string }>;
  inputProps?: InputProps;
  options?: AutocompleteOption[];
  className?: string;
  /** Fires on every keystroke/composition-end (and, alongside commits, with
   *  the settled value too) — a live-text echo. Never gates side effects on
   *  its own; see `onCommit` for that. */
  onInputChange?: (value: string) => void;
  /** Fires only when a value is explicitly settled: click, Enter, Tab,
   *  Escape with an option highlighted, or blur-autoselect. Never fires from
   *  raw typing — this is the signal to act on (persist, geocode, etc). */
  onCommit?: (value: string, option?: AutocompleteOption) => void;
  onClear?: () => void;
  value?: string;
  autoSelectIndex?: number;
  autoSelectOnBlurIndex?: number;
  defaultOpen?: boolean;
  clearButtonLabel?: string;
  positionBelowElementId?: string;
  /** data-testid applied to the outer wrapper so e2e tests can scope the
   *  input, its clear button, and its autocomplete listbox together without
   *  relying on DOM-parent traversal (e.g. `page.getByTestId(wrapperTestId)`). */
  wrapperTestId?: string;
  /** Treat a committed (selected) value as an indivisible block. Any printable
   *  keypress replaces the whole block and starts a fresh search. */
  blockMode?: boolean;
  /** Called when the block is burst-cleared by a keypress. Receives the
   *  character that triggered the clear, or '' for Backspace/Delete. */
  onDecommit?: (nextValue: string) => void;
  /** Called when Escape is pressed while the user is typing (no option
   *  highlighted). Use to reset the field to a known-good state. */
  onEscape?: () => void;
};

const useMouseMovement = () => {
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let timeoutId;

    const handleMouseMove = () => {
      setIsMoving(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  return isMoving;
};

export function Autocomplete(props: AutocompleteProps) {
  const {
    readerLabel,
    inputProps,
    Icon,
    className,
    onInputChange,
    onCommit,
    onClear,
    autoSelectIndex,
    autoSelectOnBlurIndex,
    value: inputValue,
    defaultOpen = false,
    clearButtonLabel = 'Clear',
    positionBelowElementId,
    wrapperTestId,
    blockMode = false,
    onDecommit,
    onEscape,
    ...rest
  } = props;

  const { t } = useTranslation('common');

  const appConfig = useAppConfig();

  const readerLabelId = useId();
  const fallbackInputId = useId();
  const effectiveInputId = inputProps?.id ?? fallbackInputId;

  const isMouseMoving = useMouseMovement();
  const [lastManualInput, setLastManualInput] = useState(inputValue ?? '');
  const [uniqueId, setUniqueId] = useState('');
  const [open, setOpen] = useState(defaultOpen);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isComposingRef = useRef(false);
  const [referenceWidth, setReferenceWidth] = useState<number | undefined>(
    undefined,
  );
  const [tempValue, setTempValue] = useState(inputValue || '');
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const [srStatus, setSrStatus] = useState('');

  const stayOpenOnBlurRef = useRef(false);
  // Prevents the focus handler from re-opening the dropdown when focus is
  // restored to the input programmatically after the clear button is pressed.
  const suppressNextFocusOpenRef = useRef(false);

  const options: [string, AutocompleteOptionWithIndex[]][] = useMemo(() => {
    const options = rest.options;
    if (!options) return [];

    let index = 0;
    const groupedOptions: Array<[string, AutocompleteOptionWithIndex[]]> = [];
    const groupMap = new Map<string, AutocompleteOptionWithIndex[]>();
    const groupOrder: string[] = [];

    // Preserve the original order of groups
    options.forEach((option) => {
      const group = option.group ?? '_';

      if (!groupMap.has(group)) {
        groupMap.set(group, []);
        groupOrder.push(group);
      }

      const { group: _, ...rest } = option;
      groupMap.get(group)!.push({ ...rest, index });
      index++;
    });

    // Return groups in the order they were first encountered
    groupOrder.forEach((group) => {
      groupedOptions.push([group, groupMap.get(group)!]);
    });

    return groupedOptions;
  }, [rest.options]);

  // Floating UI
  const [referenceElement, setReferenceElement] =
    useState<HTMLInputElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const { x, y, strategy, update, refs } = useFloating({
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
    strategy: positionBelowElementId ? 'fixed' : 'absolute',
  });

  const listboxMaxHeight = useMemo(() => {
    if (y == null) {
      return 'calc(100vh - 8rem)';
    }

    return `calc(100vh - ${Math.max(0, Math.ceil(y) + 8)}px)`;
  }, [y]);

  const selectedOption = useMemo(() => {
    return rest.options?.find((option) => option.value === inputValue);
  }, [rest.options, inputValue]);

  const isBlockCommitted = blockMode && !!selectedOption && currentIndex === -1;

  // Attach refs
  useEffect(() => {
    if (positionBelowElementId) {
      const targetElement = document.getElementById(positionBelowElementId);
      if (targetElement) {
        refs.setReference(targetElement);
        setReferenceWidth(targetElement.offsetWidth);
      }
    } else if (referenceElement) {
      refs.setReference(referenceElement);
      setReferenceWidth(undefined);
    }
    if (popperElement) refs.setFloating(popperElement);
    if (update) update();
  }, [referenceElement, popperElement, refs, update, positionBelowElementId]);

  const wrapperElementRef = useRef<HTMLDivElement>(null);

  const openOptions = useCallback(() => {
    setOpen(true);
  }, []);

  const openOnClick = useCallback(() => {
    if (!open) {
      referenceElement?.select();
    }

    openOptions();
  }, [referenceElement, openOptions, open]);

  const closeOptions = useCallback(() => {
    setOpen(false);
    setCurrentIndex(-1);
    stayOpenOnBlurRef.current = false;
  }, []);

  // The one place a value is announced outward: mirrors it into the visible
  // text, the "last manually entered" bookkeeping used for match-highlighting
  // and arrow-nav fallbacks, and — the only call that matters to callers —
  // `onCommit`. Used by every explicit-commit path (click, Enter, Tab,
  // Escape-with-highlight, blur-autoselect); never by raw typing.
  const commit = useCallback(
    (value: string, option?: AutocompleteOption) => {
      setTempValue(value);
      onInputChange?.(value);
      setLastManualInput(value);
      onCommit?.(value, option);
    },
    [onInputChange, onCommit],
  );

  const handleValueSelect = useCallback(
    (value: string, option?: AutocompleteOption) => {
      return (e?: MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        setOpen(false);
        setCurrentIndex(-1);
        commit(value, option);
      };
    },
    [commit],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      // Skip search updates during IME composition (Chinese, Japanese, etc.).
      // Keep tempValue in sync so the controlled input mirrors composition text.
      const nativeInputEvent = e.nativeEvent as InputEvent;
      if (isComposingRef.current || nativeInputEvent.isComposing) {
        setTempValue(e.target.value);
        return;
      }

      setCurrentIndex(-1);
      setLastManualInput(e.target.value);
      setTempValue(e.target.value);
      onInputChange?.(e.target.value);

      if (!open) {
        setOpen(true);
      }
    },
    [onInputChange, open],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;

      const nextValue = e.currentTarget.value;
      setCurrentIndex(-1);
      setLastManualInput(nextValue);
      setTempValue(nextValue);
      onInputChange?.(nextValue);

      if (!open) {
        setOpen(true);
      }
    },
    [onInputChange, open],
  );

  const handleClickOutside = useCallback(
    (event: PointerEvent) => {
      // Don't close if clicking on the dropdown itself
      if (popperElement?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
      referenceElement?.blur();
    },
    [referenceElement, popperElement],
  );

  useOnPointerDownOutside(wrapperElementRef, handleClickOutside);

  const setInputSelectionPoint = useCallback(
    (value: string) => {
      if (referenceElement) {
        referenceElement.selectionStart = referenceElement.selectionEnd =
          value.length;
      }
    },
    [referenceElement],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!rest.options) return;

      // IME uses key events (including arrows) for candidate selection.
      const nativeKeyboardEvent = e.nativeEvent as globalThis.KeyboardEvent;
      if (
        isComposingRef.current ||
        nativeKeyboardEvent.isComposing ||
        e.key === 'Process'
      ) {
        return;
      }

      // When a committed value is showing, any printable key or Backspace/Delete
      // atomically replaces it and starts a fresh search
      if (isBlockCommitted && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.length === 1) {
          e.preventDefault();
          onDecommit?.(e.key);
          setTempValue(e.key);
          setLastManualInput(e.key);
          setCurrentIndex(-1);
          setOpen(true);
          return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          onDecommit?.('');
          setTempValue('');
          setLastManualInput('');
          setCurrentIndex(-1);
          setOpen(false);
          return;
        }
        // Arrow keys, Tab, Enter, Escape — fall through to standard handling
      }

      const currentOption = rest.options[currentIndex];
      let nextIndex;

      if (e.key === 'ArrowDown') {
        if (open) {
          const nextValue = Math.min(rest.options.length, currentIndex + 1);
          const nextState = nextValue === rest.options.length ? -1 : nextValue;

          const nextOption = rest.options[nextState];

          const selectionValue =
            nextOption?.value ??
            rest.options[currentIndex]?.value ??
            lastManualInput ??
            '';
          setInputSelectionPoint(selectionValue);
          setCurrentIndex(nextState);
          setTempValue(selectionValue);
          nextIndex = nextState;
        } else {
          openOptions();
        }
      } else if (e.key === 'ArrowUp') {
        if (open) {
          e.preventDefault();

          const nextValue = Math.max(-2, currentIndex - 1);
          const nextState =
            nextValue === -2 ? rest.options.length - 1 : nextValue;

          const nextOption = rest.options[nextState];
          const selectionValue =
            nextOption?.value ??
            rest.options[currentIndex]?.value ??
            lastManualInput ??
            '';

          setInputSelectionPoint(selectionValue);
          setCurrentIndex(nextState);
          setTempValue(selectionValue);
          nextIndex = nextState;
        } else {
          const nextOption = rest.options[currentIndex];
          const selectionValue = nextOption?.value ?? lastManualInput ?? '';

          setInputSelectionPoint(selectionValue);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setCurrentIndex(-1);
        setTempValue(lastManualInput);
        nextIndex = -1;
        if (currentIndex >= 0) {
          setInputSelectionPoint(lastManualInput);
        }
      } else if (e.key === 'Escape') {
        if (open) {
          setOpen(false);
          if (currentOption) {
            commit(currentOption.value, currentOption);
          } else {
            // No option was highlighted — user was mid-typing. Let the caller
            // decide how to restore the field to a known-good state.
            onEscape?.();
          }
          setCurrentIndex(-1);
          nextIndex = -1;
        }
      } else if (e.key === 'Tab') {
        if (open) {
          setOpen(false);
          if (currentOption) {
            commit(currentOption.value, currentOption);
          } else {
            // `rest.options` is the caller's current option list — while
            // results are still loading for what's typed, the caller is
            // expected to have suppressed stale/irrelevant entries there
            // (see location-search-bar's isPendingResults), so indexing into
            // it here can't silently pick a stale option. If there's no
            // confident match at all, commit whatever's literally typed
            // rather than silently discarding it and leaving a stale
            // previously-committed value in place.
            const defaultOption =
              autoSelectIndex != null
                ? rest.options[autoSelectIndex]
                : undefined;
            commit(defaultOption?.value ?? tempValue, defaultOption);
          }
          setCurrentIndex(-1);
          nextIndex = -1;
        }
      } else if (e.key === 'Enter') {
        if (open) {
          e.preventDefault();
          setOpen(false);

          if (currentOption) {
            commit(currentOption.value, currentOption);
          } else {
            const defaultOption =
              autoSelectIndex != null
                ? rest.options[autoSelectIndex]
                : undefined;
            commit(defaultOption?.value ?? tempValue, defaultOption);
          }

          const form = (e.target as HTMLElement).closest('form');
          if (form) {
            setTimeout(() => {
              if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
                return;
              }

              form.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true }),
              );
            }, 0);
          }

          setCurrentIndex(-1);
          nextIndex = -1;
        }
      } else if (e.key === 'Home') {
        if (open) {
          e.preventDefault();

          const nextValue = 0;
          const nextState = nextValue === rest.options.length ? -1 : nextValue;

          const nextOption = rest.options[nextState];
          const selectionValue =
            nextOption?.value ??
            rest.options[currentIndex]?.value ??
            lastManualInput ??
            '';

          setInputSelectionPoint(selectionValue);
          setCurrentIndex(nextState);
          setTempValue(selectionValue);
          nextIndex = nextState;
        }
      } else if (e.key === 'End') {
        if (open) {
          e.preventDefault();

          const nextValue = rest.options.length - 1;
          const nextState = nextValue === rest.options.length ? -1 : nextValue;

          const nextOption = rest.options[nextState];
          const selectionValue =
            nextOption?.value ??
            rest.options[currentIndex]?.value ??
            lastManualInput ??
            '';

          setInputSelectionPoint(selectionValue);
          setCurrentIndex(nextState);
          setTempValue(selectionValue);
          nextIndex = nextState;
        }
      }

      if (!popperElement || nextIndex == null) return;

      const element = document.querySelector(
        `#${uniqueId}-option-${nextIndex}`,
      );
      if (nextIndex === -1) {
        popperElement.scrollTop = 0;
      } else if (element) {
        element.scrollIntoView({
          block: 'nearest',
          inline: 'start',
        });
      }
    },
    [
      rest.options,
      commit,
      open,
      openOptions,
      currentIndex,
      setInputSelectionPoint,
      autoSelectIndex,
      lastManualInput,
      popperElement,
      uniqueId,
      isBlockCommitted,
      onDecommit,
      onEscape,
      tempValue,
    ],
  );

  const clear = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      setCurrentIndex(-1);

      if (onClear) {
        onClear();
      } else {
        setTempValue('');
        onInputChange?.('');
      }

      // Close the dropdown immediately. Suppress the focus handler's auto-open
      // so focus returning to the input doesn't re-show stale suggestions.
      suppressNextFocusOpenRef.current = true;
      setOpen(false);
      referenceElement?.focus();
      setLastManualInput('');
    },
    [onInputChange, onClear, referenceElement],
  );

  const handleOptionMouseEnter = useCallback(
    (index: number) => {
      return () => {
        if (!isMouseMoving || !rest.options) return;
        const nextOption = rest.options[index];
        const selectionValue = nextOption?.value;
        setCurrentIndex(index);
        setTempValue(selectionValue);
        setInputSelectionPoint(selectionValue);
      };
    },
    [rest.options, setInputSelectionPoint, isMouseMoving],
  );

  const handleOptionMouseExit = useCallback(() => {
    return () => {
      setCurrentIndex(-1);
      setTempValue(lastManualInput);
      setInputSelectionPoint(lastManualInput);
    };
  }, [setInputSelectionPoint, lastManualInput]);

  const handleBlur = useCallback(
    (e) => {
      if (autoSelectOnBlurIndex != null && !selectedOption) {
        const selectedOptionObj = options[0]?.[1]?.[autoSelectOnBlurIndex];
        if (selectedOptionObj) {
          handleValueSelect(selectedOptionObj.value, selectedOptionObj)();
        }
      }

      // Don't close if focus moved to the clear button or we're interacting with the dropdown list
      const isMovingToClearButton = clearButtonRef.current === e.relatedTarget;
      const isMovingToDropdown = popperElement?.contains(
        e.relatedTarget as Node,
      );

      if (
        !isMovingToClearButton &&
        !isMovingToDropdown &&
        !stayOpenOnBlurRef.current
      ) {
        closeOptions();
      }
    },
    [
      autoSelectOnBlurIndex,
      closeOptions,
      handleValueSelect,
      options,
      selectedOption,
      popperElement,
    ],
  );

  const handleFocus = useCallback(() => {
    stayOpenOnBlurRef.current = false;
    if (suppressNextFocusOpenRef.current) {
      suppressNextFocusOpenRef.current = false;
      return;
    }
    setTimeout(() => {
      setOpen(true);
    }, 100);
  }, []);

  const touchOnList = useCallback(() => {
    stayOpenOnBlurRef.current = true;
    referenceElement?.blur();
  }, [referenceElement]);

  useEffect(() => {
    setTempValue(inputValue ?? '');
  }, [inputValue]);

  useEffect(() => {
    if (!open) {
      setSrStatus('');
      return;
    }
    const totalOptions = options.reduce(
      (sum, [, groupOptions]) => sum + groupOptions.length,
      0,
    );
    setSrStatus(
      totalOptions > 0
        ? t('autocomplete.results_available', { count: totalOptions })
        : t('autocomplete.no_results'),
    );
  }, [open, options, t]);

  // Set unique ID for component
  useEffect(() => {
    setUniqueId(`search-results-${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  return (
    <div
      className={cn('relative flex items-center', className)}
      ref={wrapperElementRef}
      data-testid={wrapperTestId}
    >
      <div className="relative w-full rounded-lg">
        <label
          className="sr-only"
          htmlFor={effectiveInputId}
          id={readerLabelId}
        >
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
          {srStatus}
        </div>
        {!open && uniqueId ? (
          <div id={uniqueId} role="listbox" hidden aria-hidden="true" />
        ) : null}
        <Input
          {...inputProps}
          id={effectiveInputId}
          className={cn(
            'border-control-border focus:border-primary h-auto w-full rounded-lg border p-0 px-[1.8rem] py-2 text-xs shadow-none focus-visible:ring-0',
            inputProps?.className,
          )}
          ref={setReferenceElement}
          onClick={openOnClick}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          value={tempValue}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={uniqueId}
          aria-haspopup="listbox"
          aria-labelledby={readerLabelId}
          aria-owns={uniqueId}
          aria-expanded={open}
          aria-activedescendant={
            currentIndex > -1 ? `${uniqueId}-option-${currentIndex}` : ''
          }
          role="combobox"
        />

        {(tempValue?.length ?? 0) > 0 && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild autoFocus={false}>
                <Button
                  ref={clearButtonRef}
                  size="icon"
                  variant="ghost"
                  className="absolute top-0 right-0 h-full hover:bg-transparent hover:bg-none"
                  onClick={clear}
                  aria-label={clearButtonLabel}
                  data-testid="search-clear-btn"
                  type="button"
                >
                  <XIcon className={cn('h-4 w-4 shrink-0 opacity-50')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span>{clearButtonLabel}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {open && (
          <div
            id={uniqueId}
            role="listbox"
            data-testid="autocomplete-listbox"
            aria-multiselectable="false"
            ref={setPopperElement}
            className={cn(
              'animate-opacity-in z-10 mt-2 overflow-auto overscroll-contain bg-white',
              !referenceWidth && 'w-full',
            )}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: referenceWidth ? `${referenceWidth}px` : undefined,
              maxHeight: listboxMaxHeight,
            }}
            onTouchStart={touchOnList}
            onMouseDown={touchOnList}
          >
            {options?.map((group, groupIndex) => {
              const [groupName, groupOptions] = group;
              const groupId = `${uniqueId}-group-${groupIndex}`;

              return (
                <Fragment key={groupName}>
                  {groupName === '_' ? (
                    groupIndex !== 0 && <Separator />
                  ) : (
                    <h3
                      id={groupId}
                      className="mb-3 px-3 py-1 text-xs font-medium [&:not(:first-child)]:mt-3"
                      role="presentation"
                    >
                      {groupName}
                    </h3>
                  )}
                  <div
                    className="flex flex-col gap-2"
                    role="group"
                    aria-labelledby={groupId}
                  >
                    {groupOptions?.map((option) => {
                      const optionValue = option.value ?? '';
                      const matches = optionValue
                        ? match(optionValue, lastManualInput)
                        : [];
                      const Icon = option.Icon || 'span';

                      return (
                        <div
                          key={option.index}
                          id={`${uniqueId}-option-${option.index}`}
                          role="option"
                          data-testid="autocomplete-option"
                          className={cn(
                            'flex cursor-pointer justify-between gap-2 px-3 py-2',
                            currentIndex === option.index &&
                              AUTOCOMPLETE_OPTION_ACTIVE_CLASSNAME,
                          )}
                          style={{
                            borderRadius: appConfig.brand.theme.borderRadius,
                          }}
                          aria-selected={currentIndex === option.index}
                          onMouseEnter={handleOptionMouseEnter(option.index)}
                          onMouseLeave={handleOptionMouseExit()}
                          onMouseDown={
                            handleValueSelect(
                              option.value,
                              option,
                            ) as unknown as MouseEventHandler
                          }
                        >
                          <span
                            className={cn(
                              'flex items-center gap-2 text-xs font-medium',
                              currentIndex === option.index
                                ? 'text-primary-foreground'
                                : 'text-primary',
                            )}
                          >
                            {Icon === 'span' ? null : (
                              <Icon
                                className="size-4 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <p>
                              {parse(optionValue, matches).map((text, idx) =>
                                text.highlight ? (
                                  <span
                                    key={`${optionValue}-${text.text}-${idx}`}
                                    className="font-semibold"
                                  >
                                    {text.text}
                                  </span>
                                ) : (
                                  <span
                                    key={`${optionValue}-${text.text}-${idx}`}
                                  >
                                    {text.text}
                                  </span>
                                ),
                              )}
                            </p>
                          </span>

                          {option.badge && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'w-[100px] shrink-0 text-xs',
                                currentIndex === option.index &&
                                  'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground',
                              )}
                            >
                              <p className="mx-auto truncate">{option.badge}</p>
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
