import { usePopper } from 'react-popper';
import {
  useCallback,
  useState,
  KeyboardEvent,
  ChangeEvent,
  Fragment,
  ComponentType,
  useRef,
  useId,
} from 'react';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { cn } from '@/shared/lib/utils';
import { XIcon } from 'lucide-react';
import { useUncontrolledState } from '@/hooks/use-uncontrolled-state';
import { Input, InputProps } from '../ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { useGroupedOptions } from './hooks/use-grouped-options';
import { useFlattenedOptions } from './hooks/use-flattened-options';
import { useMouseMovement } from './hooks/use-mouse-movement';

export type AutocompleteOption = {
  label?: string;
  value: string;
  group?: string;
  Icon?: ComponentType<{ className?: string }>;
};

export type AutocompleteOptionWithIndex = AutocompleteOption & {
  index: number;
};

export type AutocompleteProps = {
  options?: AutocompleteOption[];
  className?: string;
  onValueChange?: (value: string) => void;
  onInputChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
};

export function Autocomplete({
  className,
  onValueChange,
  onInputChange,
  defaultValue,
  value: inputValue,
  placeholder,
  ...rest
}: AutocompleteProps) {
  const uniqueId = useId();
  const lastManualInputRef = useRef('');
  const [open, setOpen] = useState(false);
  const isMouseMoving = useMouseMovement(open);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [value, setValue] = useUncontrolledState<string>({
    value: inputValue,
    defaultValue,
    onChange: onValueChange,
  });
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const [referenceElement, setReferenceElement] =
    useState<HTMLInputElement | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();
  const { styles, attributes } = usePopper(referenceElement, popperElement);
  const options = useGroupedOptions(rest.options);
  const flatOptions = useFlattenedOptions(options);
  const optionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const setOptionRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      optionRefs.current[index] = el;
    },
    [],
  );

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
        lastManualInputRef.current = value;
      };
    },
    [setValue],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCurrentIndex(-1);
      lastManualInputRef.current = val;
      setValue(val);

      onInputChange?.(val);

      if (!open) {
        setOpen(true);
      }
    },
    [setValue, open, onInputChange],
  );

  const setInputSelectionPoint = useCallback(
    (value: string) => {
      if (referenceElement) {
        referenceElement.selectionStart = referenceElement.selectionEnd =
          value.length;
      }
    },
    [referenceElement],
  );

  const selectValueAtIndex = useCallback(
    (index: number) => {
      const option = flatOptions[index];
      const val = option?.value ?? lastManualInputRef.current;
      setCurrentIndex(index);
      setValue(val);
      setInputSelectionPoint(val);
      return val;
    },
    [flatOptions, setValue, setInputSelectionPoint],
  );

  const getValidIndex = useCallback(
    (index: number) => {
      return index < 0
        ? flatOptions.length - 1
        : index >= flatOptions.length
          ? -1
          : index;
    },
    [flatOptions],
  );

  const handleArrowDown = useCallback(() => {
    if (!open) return openOptions();

    const nextIndex = getValidIndex(currentIndex + 1);
    selectValueAtIndex(nextIndex);
  }, [open, currentIndex, getValidIndex, selectValueAtIndex, openOptions]);

  const handleArrowUp = useCallback(() => {
    if (!open) return;

    const nextIndex =
      currentIndex <= 0 ? flatOptions.length - 1 : currentIndex - 1;
    selectValueAtIndex(nextIndex);
  }, [open, currentIndex, flatOptions.length, selectValueAtIndex]);

  const handleArrowLeftRight = useCallback(() => {
    if (open && currentIndex !== -1) {
      setCurrentIndex(-1);
      setValue(lastManualInputRef.current);
      setInputSelectionPoint(lastManualInputRef.current);
    }
  }, [setValue, setInputSelectionPoint, open, currentIndex]);

  const handleEscape = useCallback(() => {
    if (!open) return;

    const option = flatOptions[currentIndex];
    closeOptions();
    lastManualInputRef.current = option?.value ?? lastManualInputRef.current;
  }, [open, flatOptions, currentIndex, closeOptions]);

  const handleEnterOrTab = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();

      const option = flatOptions[currentIndex];
      if (option) {
        lastManualInputRef.current = option.value;
        setValue(option.value);
      }
      closeOptions();

      if (e.key === 'Enter') {
        const form = (e.target as HTMLElement).closest('form');
        if (form) {
          setTimeout(() => {
            form.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true }),
            );
          }, 0);
        }
      }
    },
    [currentIndex, flatOptions, setValue, closeOptions],
  );

  const handleHomeEnd = useCallback(
    (isEnd: boolean) => {
      if (!open) return;

      const index = isEnd ? flatOptions.length - 1 : 0;
      selectValueAtIndex(index);
    },
    [open, flatOptions.length, selectValueAtIndex],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          handleArrowDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleArrowUp();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          handleArrowLeftRight();
          break;
        case 'Escape':
          handleEscape();
          break;
        case 'Tab':
        case 'Enter':
          handleEnterOrTab(e);
          break;
        case 'Home':
          e.preventDefault();
          handleHomeEnd(false);
          break;
        case 'End':
          e.preventDefault();
          handleHomeEnd(true);
          break;
      }

      // Scroll into view
      const nextIndex =
        e.key === 'ArrowDown'
          ? currentIndex + 1
          : e.key === 'ArrowUp'
            ? currentIndex - 1
            : currentIndex;
      if (nextIndex === -1) {
        popperElement?.scrollTo({ top: 0 });
      } else {
        optionRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest' });
      }
    },
    [
      handleArrowDown,
      handleArrowUp,
      handleArrowLeftRight,
      handleEscape,
      handleEnterOrTab,
      handleHomeEnd,
      currentIndex,
      popperElement,
    ],
  );

  const clear = useCallback(
    (e) => {
      e?.preventDefault();
      setCurrentIndex(-1);
      setValue('');
      referenceElement?.focus();
      setOpen(true);
      lastManualInputRef.current = '';
    },
    [setValue, referenceElement],
  );

  const handleOptionMouseEnter = useCallback(
    (index: number) => {
      return () => {
        if (!isMouseMoving) return;
        const nextOption = flatOptions[index];
        const selectionValue = nextOption?.value;
        setCurrentIndex(index);
        setValue(selectionValue);
        setInputSelectionPoint(selectionValue);
      };
    },
    [flatOptions, setInputSelectionPoint, setValue, isMouseMoving],
  );

  const handleOptionMouseExit = useCallback(() => {
    return () => {
      setCurrentIndex(-1);
      setValue(lastManualInputRef.current);
      setInputSelectionPoint(lastManualInputRef.current);
    };
  }, [setInputSelectionPoint, setValue]);

  const handleBlur = useCallback(
    (e) => {
      if (clearButtonRef.current !== e.relatedTarget) {
        closeOptions();
      }
    },
    [closeOptions],
  );

  return (
    <div className={cn('flex w-full items-center', className)}>
      <Input
        className="rounded-none border-none px-0 shadow-none focus-visible:ring-0"
        ref={setReferenceElement}
        onClick={openOnClick}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onChange={handleInputChange}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={open ? uniqueId : undefined}
        aria-owns={open ? uniqueId : undefined}
        aria-haspopup="listbox"
        aria-label="Search"
        aria-expanded={open}
        aria-activedescendant={
          open && currentIndex > -1
            ? `${uniqueId}-option-${currentIndex}`
            : undefined
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
          style={{ ...styles.popper, width: referenceElement?.offsetWidth }}
          className="z-10 max-h-56 overflow-auto overscroll-contain rounded-md bg-white shadow-md"
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
                    className={cn(
                      'p-2 text-xs text-primary',
                      groupIndex > 0 && 'pt-4',
                    )}
                    role="presentation"
                  >
                    {groupName}
                  </h3>
                )}
                <div role="group" aria-labelledby={groupId}>
                  {groupOptions?.map((option) => {
                    const matches = match(
                      option.value,
                      lastManualInputRef.current,
                    );
                    const Icon = option.Icon;

                    return (
                      <div
                        key={option.index}
                        id={`${uniqueId}-option-${option.index}`}
                        ref={setOptionRef(option.index)}
                        role="option"
                        className={cn(
                          'flex justify-between gap-2 px-2 py-1',
                          currentIndex === option.index && 'bg-primary/5',
                        )}
                        aria-selected={currentIndex === option.index}
                        onMouseEnter={handleOptionMouseEnter(option.index)}
                        onMouseLeave={handleOptionMouseExit()}
                        onMouseDown={handleValueSelect(option.value)}
                      >
                        <span className="flex items-center gap-2">
                          {!Icon ? null : <Icon className="size-4 shrink-0" />}
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
