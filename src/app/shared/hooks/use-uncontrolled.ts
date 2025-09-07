'use client';

import { useCallback, useState } from 'react';

export function useUncontrolled<T>({
  value,
  defaultValue,
  finalValue,
  onChange = () => {},
}: {
  value?: T;
  defaultValue?: T;
  finalValue?: T;
  onChange?: (value: T, ...payload: any[]) => void;
}): [T | undefined, (value: T, ...payload: any[]) => void, boolean] {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue !== undefined ? defaultValue : finalValue,
  );

  const handleUncontrolledChange = useCallback(
    (val, ...payload: any[]) => {
      setUncontrolledValue(val);
      onChange?.(val, ...payload);
    },
    [onChange],
  );

  if (value !== undefined) {
    return [value, onChange, true];
  }

  return [uncontrolledValue, handleUncontrolledChange, false];
}
