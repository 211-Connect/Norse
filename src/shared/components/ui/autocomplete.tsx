import { usePopper } from 'react-popper';
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
import { Input, InputProps } from './input';
import { cn } from '@/shared/lib/utils';
import { Separator } from './separator';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from './button';
import { useUncontrolled } from '@/shared/hooks/use-uncontrolled';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export type AutcompleteOption = {
  label: string;
  value: string;
  group?: string;
  index?: number;
};

export type AutocompleteProps = {
  Icon?: ComponentType<{ className?: string }>;
  inputProps?: InputProps;
  options?: AutcompleteOption[];
  className?: string;
  onInputChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
};

export function Autocomplete(props: AutocompleteProps) {
  const {
    inputProps,
    Icon,
    className,
    onInputChange,
    onValueChange,
    defaultValue,
    value: inputValue,
    ...rest
  } = props;
  const lastManualInput = useRef('');
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
  const selectionTimer = useRef<NodeJS.Timeout | null>(null);

  const options: [string, AutcompleteOption[]][] = useMemo(() => {
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
      .reduce<Record<string, AutcompleteOption[]>>((acc, option) => {
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
  const { styles, attributes } = usePopper(referenceElement, popperElement);

  const openOptions = useCallback(() => {
    setOpen(true);
  }, []);

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
        lastManualInput.current = value;
      };
    },
    [setValue, onInputChange],
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(-1);
    lastManualInput.current = e.target.value;
    setValue(e.target.value);
    onInputChange?.(e.target.value);
  };

  const setInputSelectionPoint = useCallback(
    (value: string) => {
      clearTimeout(selectionTimer.current);
      selectionTimer.current = setTimeout(() => {
        referenceElement.selectionStart = referenceElement.selectionEnd =
          value.length;
      }, 0);
    },
    [referenceElement],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const currentOption = rest.options[currentIndex];

      if (e.key === 'ArrowDown') {
        if (open) {
          setCurrentIndex((prev) => {
            const nextValue = Math.min(rest.options.length, prev + 1);
            const nextState =
              nextValue === rest.options.length ? -1 : nextValue;

            const nextOption = rest.options[nextState];
            const selectionValue =
              nextOption?.value ??
              rest.options[prev]?.value ??
              lastManualInput?.current ??
              '';
            setInputSelectionPoint(selectionValue);

            return nextState;
          });
        } else {
          openOptions();
        }
      } else if (e.key === 'ArrowUp') {
        if (open) {
          setCurrentIndex((prev) => {
            const nextValue = Math.max(-2, prev - 1);
            const nextState =
              nextValue === -2 ? rest.options.length - 1 : nextValue;

            const nextOption = rest.options[nextState];
            const selectionValue =
              nextOption?.value ??
              rest.options[prev]?.value ??
              lastManualInput?.current ??
              '';

            setInputSelectionPoint(selectionValue);

            return nextState;
          });
        } else {
          const nextOption = rest.options[currentIndex];
          const selectionValue =
            nextOption?.value ?? lastManualInput?.current ?? '';

          setInputSelectionPoint(selectionValue);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setCurrentIndex(-1);
        setValue(lastManualInput.current);
        if (currentIndex >= 0) {
          setInputSelectionPoint(lastManualInput.current);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
        if (currentOption) {
          onInputChange?.(currentOption.value);
          lastManualInput.current = currentOption.value;
        }
        setCurrentIndex(-1);
      } else if (e.key === 'Tab') {
        setOpen(false);
        if (currentOption) {
          onInputChange?.(currentOption.value);
          lastManualInput.current = currentOption.value;
        }
        setCurrentIndex(-1);
      } else if (e.key === 'Enter') {
        setOpen(false);
        if (currentOption) {
          onInputChange?.(currentOption.value);
          lastManualInput.current = currentOption.value;
        }
        setCurrentIndex(-1);
      } else if (e.key === 'Home') {
        if (open) {
          e.preventDefault();
          setCurrentIndex((prev) => {
            const nextValue = 0;
            const nextState =
              nextValue === rest.options.length ? -1 : nextValue;

            const nextOption = rest.options[nextState];
            const selectionValue =
              nextOption?.value ??
              rest.options[prev]?.value ??
              lastManualInput?.current ??
              '';
            setInputSelectionPoint(selectionValue);

            return nextState;
          });
        }
      } else if (e.key === 'End') {
        if (open) {
          e.preventDefault();
          setCurrentIndex((prev) => {
            const nextValue = rest.options.length - 1;
            const nextState =
              nextValue === rest.options.length ? -1 : nextValue;

            const nextOption = rest.options[nextState];
            const selectionValue =
              nextOption?.value ??
              rest.options[prev]?.value ??
              lastManualInput?.current ??
              '';
            setInputSelectionPoint(selectionValue);

            return nextState;
          });
        }
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
    ],
  );

  const clear = useCallback(() => {
    setCurrentIndex(-1);
    setValue('');
    onInputChange?.('');
    referenceElement?.focus();
    setOpen(true);
    lastManualInput.current = '';
  }, [setValue, onInputChange, referenceElement]);

  const handleOptionMouseEnter = useCallback(
    (index: number) => {
      return () => {
        setCurrentIndex(index);
        const nextOption = rest.options[index];
        const selectionValue = nextOption?.value;
        setInputSelectionPoint(selectionValue);
      };
    },
    [rest.options, setInputSelectionPoint],
  );

  const handleOptionMouseExit = useCallback(() => {
    return () => {
      setCurrentIndex(-1);
      setValue(lastManualInput.current);
      setInputSelectionPoint(lastManualInput.current);
    };
  }, [setInputSelectionPoint, setValue]);

  const handleBlur = useCallback(
    (e) => {
      if (!e.relatedTarget) {
        closeOptions();
      }
    },
    [closeOptions],
  );

  // Ensure option stays in view
  useEffect(() => {
    if (!popperElement) return;

    const element = document.querySelector(
      `#${uniqueId}-option-${currentIndex}`,
    );
    if (currentIndex === -1) {
      popperElement.scrollTop = 0;
    } else if (element) {
      element.scrollIntoView({
        block: 'nearest',
        inline: 'start',
      });
    }
  }, [currentIndex, uniqueId, popperElement]);

  // Update next option value (temp value)
  useEffect(() => {
    if (open && currentIndex >= 0) {
      const nextOption = rest.options?.[currentIndex];
      const nextOptionValue = nextOption?.value ?? '';
      setValue(nextOptionValue);
    }
  }, [currentIndex, rest.options, setValue, open]);

  // Set unique ID for component
  useEffect(() => {
    setUnqiueId(`search-results-${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  return (
    <div className={cn('relative flex items-center border-b px-3', className)}>
      {Icon ? (
        <Icon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      ) : (
        <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      )}
      <Input
        {...inputProps}
        className="rounded-none border-none px-0 shadow-none focus-visible:ring-0"
        ref={setReferenceElement}
        onClick={openOptions}
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
          <TooltipTrigger asChild>
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
          className="z-10 mt-2 max-h-56 w-full overflow-auto rounded-md bg-white shadow-md"
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
                    className="px-3 py-1 text-xs text-primary"
                    role="presentation"
                  >
                    {groupName}
                  </h3>
                )}
                <div role="group" aria-labelledby={groupId}>
                  {groupOptions?.map((option, idx) => {
                    return (
                      <div
                        key={option.index}
                        id={`${uniqueId}-option-${option.index}`}
                        role="option"
                        className={cn(
                          'px-3 py-1 text-sm',
                          currentIndex === option.index && 'bg-primary/5',
                        )}
                        aria-selected={currentIndex === option.index}
                        onMouseEnter={handleOptionMouseEnter(option.index)}
                        onMouseLeave={handleOptionMouseExit()}
                        onMouseDown={handleValueSelect(option.value)}
                      >
                        {option.value}
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
