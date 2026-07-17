'use client';

import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useEffect, useRef, useState } from 'react';

import { useDebounce } from '../hooks/use-debounce';
import { cn } from '../lib/utils';
import { Input } from './ui/input';

interface ListSearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onChange: (value: string) => void;
  debounceDelay?: number;
  className?: string;
  inputId?: string;
  testId?: string;
}

/**
 * Debounced text filter input used to search/filter a list of items
 * (e.g. favorites lists, printable directories).
 */
export function ListSearchBar({
  placeholder,
  initialValue = '',
  onChange,
  debounceDelay = 200,
  className,
  inputId = 'list-search-input',
  testId = 'list-search-input',
}: ListSearchBarProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const debouncedValue = useDebounce(inputValue, debounceDelay);
  const prevDebouncedValue = useRef(initialValue);

  // Update input value if initialValue changes (e.g. from URL)
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Trigger onChange only when debounced value changes and is different from previous
  useEffect(() => {
    if (debouncedValue !== prevDebouncedValue.current) {
      onChange(debouncedValue);
      prevDebouncedValue.current = debouncedValue;
    }
  }, [debouncedValue, onChange]);

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        {placeholder ?? 'Search'}
      </label>
      <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        id={inputId}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="pl-9"
        data-testid={testId}
      />
    </div>
  );
}
