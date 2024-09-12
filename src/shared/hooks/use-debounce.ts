import { useEffect, useState } from 'react';

export function useDebounce(value = null, delay = 300) {
  const [_value, setValue] = useState(value);

  useEffect(() => {
    let timeout = null;

    timeout = setTimeout(() => {
      setValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return _value;
}
