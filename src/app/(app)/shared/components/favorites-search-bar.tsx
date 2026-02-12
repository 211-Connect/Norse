'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { useDebounce } from '../hooks/use-debounce';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';

interface FavoritesSearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onChange: (value: string) => void;
  debounceDelay?: number;
  className?: string;
}

export function FavoritesSearchBar({
  placeholder,
  initialValue = '',
  onChange,
  debounceDelay = 200,
  className,
}: FavoritesSearchBarProps) {
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
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
