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

export function Autocomplete({
  inputProps,
  Icon,
  className,
  onInputChange,
  onValueChange,
  defaultValue,
  value: inputValue,
  ...rest
}: AutocompleteProps) {
  const uniqueId = useMemo(
    () => `search-results-${Math.random().toString(36).substring(2, 9)}`,
    [],
  );
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [value, setValue] = useUncontrolled<string>({
    value: inputValue,
    defaultValue,
    finalValue: '',
    onChange: onValueChange,
  });
  const clearButtonRef = useRef(null);
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

  const handleFocus = useCallback(() => {
    setOpen(true);
  }, []);

  const handleBlur = useCallback((e) => {
    setOpen(false);
    setCurrentIndex(-1);
  }, []);

  const handleHover = useCallback((index: number) => {
    return () => {
      setCurrentIndex(index);
    };
  }, []);

  const handleValueSelect = useCallback(
    (value: string) => {
      return (e) => {
        setValue(value);
        setOpen(false);
        setCurrentIndex(-1);
      };
    },
    [setValue],
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onInputChange?.(e.target.value);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        setCurrentIndex((prev) => {
          const nextValue = Math.min(rest.options.length, prev + 1);
          const nextState = nextValue === rest.options.length ? -1 : nextValue;

          const nextOption = rest.options[nextState];
          const nextOptionValue = nextOption?.value ?? '';

          setTimeout(() => {
            referenceElement.selectionStart = referenceElement.selectionEnd =
              nextOptionValue.length;
          }, 0);

          return nextState;
        });
      } else if (e.key === 'ArrowUp') {
        setCurrentIndex((prev) => {
          const nextValue = Math.max(-2, prev - 1);
          const nextState =
            nextValue === -2 ? rest.options.length - 1 : nextValue;

          const nextOption = rest.options[nextState];
          const nextOptionValue = nextOption?.value ?? '';

          setTimeout(() => {
            referenceElement.selectionStart = referenceElement.selectionEnd =
              nextOptionValue.length;
          }, 0);

          return nextState;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setCurrentIndex(-1);
        setValue('');
      }
    },
    [rest.options, setValue, referenceElement],
  );

  const clear = useCallback(() => {
    setCurrentIndex(-1);
    setValue('');
    referenceElement?.focus();
  }, [referenceElement, setValue]);

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

  useEffect(() => {
    const nextOption = rest.options?.[currentIndex];
    const nextOptionValue = nextOption?.value ?? '';
    setValue(nextOptionValue);
  }, [currentIndex, rest.options, setValue]);

  return (
    <div className={cn('relative flex items-center border-b px-3', className)}>
      {Icon ? (
        <Icon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      ) : (
        <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      )}
      <Input
        className="rounded-none border-none px-0 shadow-none focus-visible:ring-0"
        ref={setReferenceElement}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        value={value}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={uniqueId}
        aria-expanded={open}
        aria-activedescendant={
          currentIndex > -1 ? `${uniqueId}-option-${currentIndex}` : ''
        }
        role="combobox"
        {...inputProps}
      />
      <Button
        ref={clearButtonRef}
        size="icon"
        variant="ghost"
        className={cn(value.length > 0 ? 'visible' : 'invisible')}
        onClick={clear}
        aria-label="Clear"
      >
        <XIcon className={cn('h-4 w-4 shrink-0 opacity-50')} />
      </Button>

      {open && (
        <div
          id={uniqueId}
          role="listbox"
          ref={setPopperElement}
          style={styles.popper}
          className="z-10 mt-2 max-h-56 w-full overflow-auto rounded-md bg-white shadow-md"
          {...attributes.popper}
        >
          {options?.map((group, groupIndex) => {
            const [groupName, groupOptions] = group;

            return (
              <Fragment key={groupName}>
                {groupName === '_' ? (
                  <Separator />
                ) : (
                  <h3 className="px-3 py-1 text-xs text-primary">
                    {groupName}
                  </h3>
                )}

                {groupOptions?.map((option) => {
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
                      onMouseEnter={handleHover(option.index)}
                      onMouseLeave={handleHover(-1)}
                      onClick={handleValueSelect(option.value)}
                    >
                      {option.value}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
