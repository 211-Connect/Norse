'use client';

import { useEffect, useState } from 'react';

export function useDebounce(value: any = null, delay = 300) {
  const [_value, setValue] = useState(value);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    timeout = setTimeout(() => {
      setValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return _value;
}
