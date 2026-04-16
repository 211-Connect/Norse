'use client';

import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react';
import {
  useCallback,
  useState,
  KeyboardEvent,
  MouseEvent,
  ChangeEvent,
  useMemo,
  Fragment,
  ComponentType,
  useEffect,
  useRef,
  MouseEventHandler,
  useId,
  type ReactNode,
} from 'react';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { useUncontrolled } from '@/app/(app)/shared/hooks/use-uncontrolled';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Input, InputProps } from './input';
import { Separator } from './separator';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { Badge } from './badge';
import { useTranslation } from 'react-i18next';
import { useOnPointerDownOutside } from '../../hooks/use-on-pointer-down-outside';

// scrollable 276

export type AutocompleteOption = {
  label?: string;
  value: string;
  group?: string;
  Icon?: ComponentType<{ className?: string }>;
  queryType?: string;
};

type AutocompleteOptionWithIndex = AutocompleteOption & { index: number };

export type AutocompleteProps = {
  readerLabel: ReactNode;
  Icon?: ComponentType<{ className?: string }>;
  inputProps?: InputProps;
  options?: AutocompleteOption[];
  className?: string;
  onInputChange?: (value: string) => void;
  onValueChange?: (value: string, option?: AutocompleteOption) => void;
  onClear?: () => void;
  value?: string;
  defaultValue?: string;
  autoSelectIndex?: number;
  autoSelectOnBlurIndex?: number;
  defaultOpen?: boolean;
  clearButtonLabel?: string;
  enterKeyBehavior?: 'submit-form' | 'focus-target';
  enterKeyFocusTargetId?: string;
  positionBelowElementId?: string;
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
    onValueChange,
    onClear,
    defaultValue,
    autoSelectIndex,
    autoSelectOnBlurIndex,
    value: inputValue,
    defaultOpen = false,
    clearButtonLabel = 'Clear',
    enterKeyBehavior = 'submit-form',
    enterKeyFocusTargetId,
    positionBelowElementId,
    ...rest
  } = props;

  const { t } = useTranslation('common');

  const readerLabelId = useId();
  const fallbackInputId = useId();
  const effectiveInputId = inputProps?.id ?? fallbackInputId;

  const isMouseMoving = useMouseMovement();
  const [lastManualInput, setLastManualInput] = useState(
    inputValue ?? defaultValue ?? '',
  );
  const [uniqueId, setUniqueId] = useState('');
  const [open, setOpen] = useState(defaultOpen);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [referenceWidth, setReferenceWidth] = useState<number | undefined>(
    undefined,
  );
  const [value, setValue] = useUncontrolled<string>({
    value: inputValue,
    defaultValue,
    finalValue: '',
    onChange: onValueChange,
  });
  const [tempValue, setTempValue] = useState(value || '');
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const [srStatus, setSrStatus] = useState('');

  const stayOpenOnBlurRef = useRef(false);

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

  const selectedOption = useMemo(() => {
    return rest.options?.find((option) => option.value === value);
  }, [rest.options, value]);

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

  const handleValueSelect = useCallback(
    (value: string, option?: AutocompleteOption) => {
      return (e?: MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        setValue(value);
        setOpen(false);
        setCurrentIndex(-1);
        onInputChange?.(value);
        setLastManualInput(value);
        onValueChange?.(value, option);
      };
    },
    [setValue, onInputChange, onValueChange],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCurrentIndex(-1);
      setLastManualInput(e.target.value);
      setValue(e.target.value);
      onInputChange?.(e.target.value);

      if (!open) {
        setOpen(true);
      }
    },
    [onInputChange, setValue, open],
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
            onInputChange?.(currentOption.value);
            setLastManualInput(currentOption.value);
            onValueChange?.(currentOption.value, currentOption);
          }
          setCurrentIndex(-1);
          nextIndex = -1;
        }
      } else if (e.key === 'Tab') {
        if (open) {
          setOpen(false);
          if (currentOption) {
            onInputChange?.(currentOption.value);
            setLastManualInput(currentOption.value);
            onValueChange?.(currentOption.value, currentOption);
          } else if (autoSelectIndex != null) {
            const defaultOption = rest.options[autoSelectIndex];
            if (defaultOption) {
              onInputChange?.(defaultOption.value);
              setValue(defaultOption.value);
              setLastManualInput(defaultOption.value);
              onValueChange?.(defaultOption.value, defaultOption);
            }
          }
          setCurrentIndex(-1);
          nextIndex = -1;
        }
      } else if (e.key === 'Enter') {
        if (open) {
          e.preventDefault();
          setOpen(false);

          if (currentOption) {
            onInputChange?.(currentOption.value);
            setLastManualInput(currentOption.value);
            onValueChange?.(currentOption.value, currentOption);
          } else if (autoSelectIndex != null) {
            const defaultOption = rest.options[autoSelectIndex];
            if (defaultOption) {
              onInputChange?.(defaultOption.value);
              setValue(defaultOption.value);
              setLastManualInput(defaultOption.value);
              onValueChange?.(defaultOption.value, defaultOption);
            }
          }

          if (enterKeyBehavior === 'focus-target' && enterKeyFocusTargetId) {
            setTimeout(() => {
              document.getElementById(enterKeyFocusTargetId)?.focus();
            }, 0);
          } else {
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
      setValue,
      open,
      openOptions,
      currentIndex,
      onInputChange,
      setInputSelectionPoint,
      autoSelectIndex,
      lastManualInput,
      popperElement,
      uniqueId,
      onValueChange,
      enterKeyBehavior,
      enterKeyFocusTargetId,
    ],
  );

  const clear = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      setCurrentIndex(-1);

      if (onClear) {
        onClear();
      } else {
        setValue('');
        onInputChange?.('');
      }

      referenceElement?.focus();
      setOpen(true);
      setLastManualInput('');
    },
    [setValue, onInputChange, onClear, referenceElement],
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
    setTimeout(() => {
      setOpen(true);
    }, 100);
  }, []);

  const touchOnList = useCallback(() => {
    stayOpenOnBlurRef.current = true;
    referenceElement?.blur();
  }, [referenceElement]);

  useEffect(() => {
    setTempValue(value ?? '');
  }, [value]);

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
    >
      <div className="relative w-full">
        <label
          className="sr-only"
          htmlFor={effectiveInputId}
          id={readerLabelId}
        >
          {readerLabel}
        </label>
        {Icon ? (
          <Icon
            className="absolute left-2 top-2 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        ) : (
          <SearchIcon
            className="absolute left-2 top-2 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        )}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {srStatus}
        </div>
        <Input
          {...inputProps}
          id={effectiveInputId}
          className={cn(
            'h-auto w-full rounded-lg border p-0 px-[1.8rem] py-2 text-xs shadow-none focus:border-primary focus-visible:ring-0',
            inputProps?.className,
          )}
          ref={setReferenceElement}
          onClick={openOnClick}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleInputChange}
          value={tempValue}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={open ? uniqueId : undefined}
          aria-haspopup="listbox"
          aria-labelledby={readerLabelId}
          aria-owns={uniqueId}
          aria-expanded={open}
          aria-activedescendant={
            currentIndex > -1 ? `${uniqueId}-option-${currentIndex}` : ''
          }
          role="combobox"
        />

        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild autoFocus={false}>
              <Button
                ref={clearButtonRef}
                size="icon"
                variant="ghost"
                className={cn(
                  (value?.length ?? 0) > 0 ? 'visible' : 'invisible',
                  'absolute right-0 top-0 h-full hover:bg-transparent hover:bg-none',
                )}
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

        {open && (
          <div
            id={uniqueId}
            role="listbox"
            data-testid="autocomplete-listbox"
            aria-multiselectable="false"
            ref={setPopperElement}
            className={cn(
              'z-10 mt-2 animate-opacity-in overflow-auto overscroll-contain bg-white',
              !referenceWidth && 'w-full',
            )}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: referenceWidth ? `${referenceWidth}px` : undefined,
              maxHeight: 'calc(100vh - 384px)',
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
                            currentIndex === option.index && 'bg-primary/5',
                          )}
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
                          <span className="flex items-center gap-2 text-xs font-medium text-primary">
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

                          {option.label && (
                            <Badge
                              variant="outline"
                              className="w-[100px] shrink-0 text-xs"
                            >
                              <p className="mx-auto truncate">{option.label}</p>
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
