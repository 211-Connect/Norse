import {
  useCallback,
  useState,
  KeyboardEvent,
  ChangeEvent,
  useMemo,
  Fragment,
  ComponentType,
  useEffect,
  useRef,
} from 'react';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { useUncontrolled } from '@/shared/hooks/use-uncontrolled';
import { cn } from '@/shared/lib/utils';
import { Input } from './input';
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

export type AutocompleteOption = {
  label?: string;
  value: string;
  group?: string;
  Icon?: ComponentType<{ className?: string }>;
};

type AutocompleteOptionWithIndex = AutocompleteOption & { index: number };

export type AutocompleteProps = {
  Icon?: ComponentType<{ className?: string }>;
  inputProps?: React.ComponentProps<'input'>;
  options?: AutocompleteOption[];
  className?: string;
  onInputChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
  autoSelectIndex?: number;
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
    inputProps,
    Icon,
    className,
    onInputChange,
    onValueChange,
    defaultValue,
    autoSelectIndex,
    value: inputValue,
    ...rest
  } = props;
  const isMouseMoving = useMouseMovement();
  const [lastManualInput, setLastManualInput] = useState('');
  const [uniqueId, setUnqiueId] = useState('');
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [value, setValue] = useUncontrolled<string>({
    value: inputValue,
    defaultValue,
    finalValue: '',
    onChange: onValueChange,
  });
  const clearButtonRef = useRef(null);

  const options: [string, AutocompleteOptionWithIndex[]][] = useMemo(() => {
    const options = rest.options;
    if (!options) return [];

    let index = 0;
    const groupedOptions = options
      .sort((a, b) => {
        const groupA = a?.group?.toUpperCase();
        const groupB = b?.group?.toUpperCase();

        if (groupA === undefined && groupB === undefined) {
          return 0;
        }

        if (groupA === undefined) {
          return 1;
        }

        if (groupB === undefined) {
          return -1;
        }

        if (groupA < groupB) {
          return -1;
        }

        if (groupA > groupB) {
          return 1;
        }

        return 0;
      })
      .reduce<Record<string, AutocompleteOptionWithIndex[]>>((acc, option) => {
        const group = option.group ?? '_';
        if (!acc[group]) {
          acc[group] = [];
        }

        const { group: _, ...rest } = option;

        acc[group].push({ ...rest, index });
        index++;
        return acc;
      }, {});

    return Object.entries(groupedOptions).map(([key, value]) => [key, value]);
  }, [rest.options]);

  // Popper
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  // const { styles, attributes } = usePopper(referenceElement, popperElement);

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
  }, []);

  const handleValueSelect = useCallback(
    (value: string) => {
      return (e) => {
        e.preventDefault();
        e.stopPropagation();

        setValue(value);
        setOpen(false);
        setCurrentIndex(-1);
        onInputChange?.(value);
        setLastManualInput(value);
      };
    },
    [setValue, onInputChange],
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

  const setInputSelectionPoint = useCallback(
    (value: string) => {
      referenceElement.selectionStart = referenceElement.selectionEnd =
        value.length;
    },
    [referenceElement],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const currentOption = rest?.options[currentIndex];
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
          setValue(selectionValue);
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
          setValue(selectionValue);
          nextIndex = nextState;
        } else {
          const nextOption = rest.options[currentIndex];
          const selectionValue = nextOption?.value ?? lastManualInput ?? '';

          setInputSelectionPoint(selectionValue);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setCurrentIndex(-1);
        setValue(lastManualInput);
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
          } else if (autoSelectIndex != null) {
            const defaultOption = rest.options[autoSelectIndex];
            if (defaultOption) {
              onInputChange?.(defaultOption.value);
              setValue(defaultOption.value);
              setLastManualInput(defaultOption.value);
            }
          }
          setCurrentIndex(-1);
          nextIndex = -1;
        }
      } else if (e.key === 'Enter') {
        if (open) {
          setOpen(false);
          if (currentOption) {
            onInputChange?.(currentOption.value);
            setLastManualInput(currentOption.value);
          } else if (autoSelectIndex != null) {
            e.preventDefault();
            const defaultOption = rest.options[autoSelectIndex];
            if (defaultOption) {
              onInputChange?.(defaultOption.value);
              setValue(defaultOption.value);
              setLastManualInput(defaultOption.value);
            }
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
              setTimeout(() => {
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
          setValue(selectionValue);
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
          setValue(selectionValue);
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
    ],
  );

  const clear = useCallback(
    (e) => {
      e?.preventDefault();
      setCurrentIndex(-1);
      setValue('');
      onInputChange?.('');
      referenceElement?.focus();
      setOpen(true);
      setLastManualInput('');
    },
    [setValue, onInputChange, referenceElement],
  );

  const handleOptionMouseEnter = useCallback(
    (index: number) => {
      return () => {
        if (!isMouseMoving) return;
        const nextOption = rest.options[index];
        const selectionValue = nextOption?.value;
        setCurrentIndex(index);
        setValue(selectionValue);
        setInputSelectionPoint(selectionValue);
      };
    },
    [rest.options, setInputSelectionPoint, setValue, isMouseMoving],
  );

  const handleOptionMouseExit = useCallback(() => {
    return () => {
      setCurrentIndex(-1);
      setValue(lastManualInput);
      setInputSelectionPoint(lastManualInput);
    };
  }, [setInputSelectionPoint, setValue, lastManualInput]);

  const handleBlur = useCallback(
    (e) => {
      if (clearButtonRef.current !== e.relatedTarget) {
        closeOptions();
      }
    },
    [closeOptions],
  );

  // Set unique ID for component
  useEffect(() => {
    setUnqiueId(`search-results-${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  return (
    <div
      className={cn('relative flex items-center border-b px-3 py-1', className)}
    >
      {Icon ? (
        <Icon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      ) : (
        <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      )}
      <Input
        {...inputProps}
        className="rounded-none border-none px-0 shadow-none focus-visible:ring-0"
        ref={setReferenceElement}
        onClick={openOnClick}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onChange={handleInputChange}
        value={value}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={open ? uniqueId : undefined}
        aria-haspopup="listbox"
        aria-label={inputProps?.placeholder ?? ''}
        aria-owns={uniqueId}
        aria-expanded={open}
        aria-activedescendant={
          currentIndex > -1 ? `${uniqueId}-option-${currentIndex}` : ''
        }
        role="combobox"
      />

      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild autoFocus={false} tabIndex={-1}>
            <Button
              ref={clearButtonRef}
              size="icon"
              variant="ghost"
              className={cn(
                value.length > 0 ? 'visible' : 'invisible',
                'hover:bg-transparent hover:bg-none',
              )}
              onClick={clear}
              aria-label="Clear"
              type="button"
            >
              <XIcon className={cn('h-4 w-4 shrink-0 opacity-50')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Clear</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && (
        <div
          id={uniqueId}
          role="listbox"
          aria-multiselectable="false"
          ref={setPopperElement}
          style={styles.popper}
          className="z-10 max-h-56 w-full overflow-auto overscroll-contain rounded-md bg-white shadow-md"
          {...attributes.popper}
        >
          {options?.map((group, groupIndex) => {
            const [groupName, groupOptions] = group;
            const groupId = `${uniqueId}-group-${groupIndex}`;

            return (
              <Fragment key={groupName}>
                {groupName === '_' ? (
                  <Separator />
                ) : (
                  <h3
                    id={groupId}
                    className="text-primary px-3 py-1 text-xs"
                    role="presentation"
                  >
                    {groupName}
                  </h3>
                )}
                <div role="group" aria-labelledby={groupId}>
                  {groupOptions?.map((option) => {
                    const matches = match(option.value, lastManualInput);
                    const Icon = option.Icon || 'span';

                    return (
                      <div
                        key={option.index}
                        id={`${uniqueId}-option-${option.index}`}
                        role="option"
                        className={cn(
                          'flex justify-between gap-2 px-3 py-1',
                          currentIndex === option.index && 'bg-primary/5',
                        )}
                        aria-selected={currentIndex === option.index}
                        onMouseEnter={handleOptionMouseEnter(option.index)}
                        onMouseLeave={handleOptionMouseExit()}
                        onMouseDown={handleValueSelect(option.value)}
                      >
                        <span className="flex items-center gap-2">
                          {Icon === 'span' ? null : (
                            <Icon className="size-4 shrink-0" />
                          )}
                          <p>
                            {parse(option.value, matches).map((text, idx) =>
                              text.highlight ? (
                                <span
                                  key={`${option.value}-${text.text}-${idx}`}
                                  className="font-semibold"
                                >
                                  {text.text}
                                </span>
                              ) : (
                                <span
                                  key={`${option.value}-${text.text}-${idx}`}
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
  );
}
