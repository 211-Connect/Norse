import { useEffect, useRef, useState } from 'react';

export default function useDebounce(
  value: string,
  config?: { timeout?: number }
) {
  if (config == null) config = {};
  if (config.timeout == null) config.timeout = 300;

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    clearTimeout(timeoutRef?.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, config.timeout);
  }, [value, config.timeout]);

  return debouncedValue;
}
