import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
import {
  ComponentType,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Skeleton } from './skeleton';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

export type Option = {
  value?: string;
  group?: string;
  items?: Option[];
  label?: string;
  [key: string]: any;
};

export default function Autocomplete({
  className,
  onValueChange,
  options,
  placeholder,
  disabled,
  emptyMessage,
  isLoading,
  name,
  defaultValue,
  Icon,
  value,
  onValueSelect,
}: {
  className?: string;
  onValueChange?: (value: Option) => void;
  onValueSelect?: (value: Option) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  name?: string;
  defaultValue?: string;
  Icon?: ComponentType;
  value?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // Keep the options displayed when the user is typing
      if (!isOpen) {
        setOpen(true);
      }

      if (event.key === 'Escape') {
        input.blur();
      }
    },
    [isOpen]
  );

  const handleBlur = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setInputValue(selectedOption.value);
      onValueChange?.(selectedOption);
      onValueSelect?.(selectedOption);

      // This is a hack to prevent the input from being focused after the user selects an option
      // We can call this hack: "The next tick"
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [onValueChange, onValueSelect]
  );

  const handleInputChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
      onValueChange?.({ value: newValue });
    },
    [onValueChange]
  );

  // This will update internal value when value gets bound from a parent component
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Using defaultValue to set the input value here
  // This is because sometimes this defaultValue can come from react router
  // which may be undefined/null on first render
  // defaultValue should never be updated more than once, but we will leave that up to the
  // components consuming this to make sure of that
  useEffect(() => {
    if (defaultValue != null) {
      setInputValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <CommandPrimitive
      className={cn(className)}
      onKeyDown={handleKeyDown}
      shouldFilter={false}
    >
      <div>
        <CommandInput
          id={name}
          name={name}
          ref={inputRef}
          value={inputValue}
          onValueChange={isLoading ? undefined : handleInputChange}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          disabled={disabled}
          Icon={Icon}
        />
      </div>

      <div className="relative mt-1">
        <div
          className={cn(
            'animate-in fade-in-0 absolute top-0 z-50 bg-white w-full rounded-md shadow-md',
            isOpen ? 'block' : 'hidden'
          )}
        >
          <CommandList>
            {isLoading ? (
              <CommandPrimitive.Loading>
                <div className="p-1">
                  <Skeleton className="h-8 w-full" />
                </div>
              </CommandPrimitive.Loading>
            ) : null}

            {(emptyMessage?.length ?? 0) > 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}

            {options.map((option) => {
              if (!option.group) {
                const matches = match(option.value, inputValue);

                return (
                  <CommandItem
                    className="p-1 pl-2 pr-2 ml-1 mr-1 text-sm flex justify-between gap-2"
                    key={option.value}
                    value={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelectOption(option)}
                  >
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
                          <span key={`${option.value}-${text.text}-${idx}`}>
                            {text.text}
                          </span>
                        )
                      )}
                    </p>
                    {option.label && (
                      <Badge
                        variant="outline"
                        className="w-[100px] text-xs shrink-0"
                      >
                        <p className="truncate">{option.label}</p>
                      </Badge>
                    )}
                  </CommandItem>
                );
              }

              if (option.items.length === 0) return null;

              return (
                <Fragment key={option.group}>
                  <CommandGroup heading={option.group}>
                    {option.items.map((option) => {
                      const matches = match(option.value, inputValue);

                      return (
                        <CommandItem
                          className="p-1 pl-2 pr-2 text-sm flex justify-between gap-2"
                          key={option.value}
                          value={option.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onSelect={() => handleSelectOption(option)}
                        >
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
                              )
                            )}
                          </p>
                          {option.label && (
                            <Badge
                              variant="outline"
                              className="w-[100px] text-xs  shrink-0"
                            >
                              <p className="truncate">{option.label}</p>
                            </Badge>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator className="mb-1" />
                </Fragment>
              );
            })}
          </CommandList>
        </div>
      </div>
    </CommandPrimitive>
  );
}
