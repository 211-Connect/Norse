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
  useEffect,
} from 'react';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { cn } from '@/shared/lib/utils';
import { XIcon } from 'lucide-react';
import { useUncontrolledState } from '@/hooks/use-uncontrolled-state';
import { Input } from '../ui/input';
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
  Icon?: ComponentType<{ className?: string; size?: number | string }>;
  onClick?: () => void;
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
    (option: AutocompleteOptionWithIndex) => {
      return (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (option.onClick) {
          option.onClick();
          closeOptions();
          return;
        }

        setValue(option.value);
        onInputChange?.(option.value);
        setOpen(false);
        setCurrentIndex(-1);
        lastManualInputRef.current = option.value;
      };
    },
    [setValue, closeOptions, onInputChange],
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

        requestAnimationFrame(() => {
          referenceElement.scrollLeft = referenceElement.scrollWidth;
        });
      }
    },
    [referenceElement],
  );

  const selectValueAtIndex = useCallback(
    (index: number) => {
      if (index === -1) {
        setCurrentIndex(-1);
        setValue(lastManualInputRef.current);
        setInputSelectionPoint(lastManualInputRef.current);
        popperElement?.scrollTo({ top: 0 });
        return;
      }

      const clampedIndex = Math.max(0, Math.min(index, flatOptions.length - 1));
      const option = flatOptions[clampedIndex];

      setCurrentIndex(clampedIndex);

      if (!option || option.onClick) return;

      const val = option.value;
      setValue(val);
      setInputSelectionPoint(val);

      const node = optionRefs.current[clampedIndex];
      if (node) {
        node.scrollIntoView({ block: 'nearest' });
      }

      return val;
    },
    [flatOptions, setValue, setInputSelectionPoint, popperElement],
  );

  const getValidIndex = useCallback(
    (index: number) => {
      if (index === -2) return flatOptions.length - 1;
      if (index === flatOptions.length) return -1;
      if (index === -1 && currentIndex === flatOptions.length - 1) return 0;
      if (index === -1 && currentIndex === 0) return -1;
      if (index === -1) return 0;
      return Math.max(-1, Math.min(index, flatOptions.length - 1));
    },
    [flatOptions, currentIndex],
  );

  const handleArrowDown = useCallback(() => {
    if (!open) return openOptions();

    const nextIndex = getValidIndex(currentIndex + 1);
    selectValueAtIndex(nextIndex);
  }, [open, currentIndex, getValidIndex, selectValueAtIndex, openOptions]);

  const handleArrowUp = useCallback(() => {
    if (!open) return;

    const nextIndex = getValidIndex(currentIndex - 1);
    selectValueAtIndex(nextIndex);
  }, [open, currentIndex, getValidIndex, selectValueAtIndex]);

  const handleArrowLeftRight = useCallback(() => {
    if (open && currentIndex !== -1) {
      setCurrentIndex(-1);
      setValue(lastManualInputRef.current);
      setInputSelectionPoint(lastManualInputRef.current);
    }
  }, [setValue, setInputSelectionPoint, open, currentIndex]);

  const handleEscape = useCallback(() => {
    if (!open) return;

    closeOptions();
    setValue(lastManualInputRef.current);
    setCurrentIndex(-1);
  }, [open, closeOptions, setValue]);

  const handleEnterOrTab = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const option = flatOptions[currentIndex];

      if (open && currentIndex !== -1) {
        e.preventDefault();
        e.stopPropagation();

        if (option?.onClick) {
          option.onClick();
        } else if (option) {
          lastManualInputRef.current = option.value;
          setValue(option.value);
          onInputChange?.(option.value);
        }
      }

      closeOptions();
    },
    [open, currentIndex, flatOptions, setValue, closeOptions, onInputChange],
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
    },
    [
      handleArrowDown,
      handleArrowUp,
      handleArrowLeftRight,
      handleEscape,
      handleEnterOrTab,
      handleHomeEnd,
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
      lastManualInputRef.current = '';
    },
    [setValue, referenceElement, onInputChange],
  );

  const handleOptionMouseEnter = useCallback(
    (index: number) => {
      return () => {
        if (!isMouseMoving) return;
        const nextOption = flatOptions[index];
        setCurrentIndex(index);

        if (nextOption.onClick) return;
        const selectionValue = nextOption?.value;
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

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        referenceElement?.contains(target) ||
        popperElement?.contains(target) ||
        clearButtonRef.current?.contains(target)
      ) {
        return;
      }

      closeOptions();
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, referenceElement, popperElement, closeOptions]);

  const prevValueRef = useRef<string | undefined>(inputValue);

  useEffect(() => {
    const isExternalChange =
      inputValue !== prevValueRef.current &&
      currentIndex === -1 &&
      !isMouseMoving;

    if (isExternalChange && inputValue !== undefined) {
      lastManualInputRef.current = inputValue;
    }

    prevValueRef.current = inputValue;
  }, [inputValue, currentIndex, isMouseMoving]);

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
                'hover:bg-transparent hover:bg-none',
                value.length > 0
                  ? 'pointer-events-auto opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
              onClick={clear}
              aria-label="Clear"
              type="button"
            >
              <XIcon className="h-4 w-4 shrink-0 opacity-50" />
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
                      'px-2 pb-1 pt-3 text-xs uppercase tracking-wide text-muted-foreground',
                      groupIndex > 0 && 'pt-4',
                    )}
                    role="presentation"
                  >
                    {groupName}
                  </h3>
                )}
                <div role="group" aria-labelledby={groupId}>
                  {groupOptions?.map((option) => {
                    const matches =
                      option.value && !option.onClick
                        ? match(option.value, lastManualInputRef.current)
                        : [];
                    const Icon = option.Icon;

                    return (
                      <div
                        key={option.index}
                        id={`${uniqueId}-option-${option.index}`}
                        ref={setOptionRef(option.index)}
                        role="option"
                        className={cn(
                          'flex justify-between gap-2 px-3 py-2 transition-colors',
                          currentIndex === option.index && 'bg-muted/50',
                          option.onClick &&
                            'cursor-pointer rounded-md px-4 py-2 text-sm',
                        )}
                        aria-selected={currentIndex === option.index}
                        onMouseEnter={handleOptionMouseEnter(option.index)}
                        onMouseLeave={handleOptionMouseExit()}
                        onMouseDown={handleValueSelect(option)}
                      >
                        <span className="flex items-center gap-2">
                          {!Icon ? null : (
                            <Icon size={16} className="shrink-0 opacity-50" />
                          )}
                          <p className={cn(option.onClick && 'font-medium')}>
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
