import { useState } from 'react';

export default function useUncontrolled<T>({
  value,
  defaultValue,
  finalValue,
  onChange = () => {},
}: {
  value?: T;
  defaultValue?: T;
  finalValue?: T;
  onChange?: (value: T, ...payload: any[]) => void;
}): [T, (value: T, ...payload: any[]) => void, boolean] {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue !== undefined ? defaultValue : finalValue
  );

  const handleUncontrolledChange = (val, ...payload: any[]) => {
    setUncontrolledValue(val);
    onChange?.(val, ...payload);
  };

  if (value !== undefined) {
    return [value, onChange, true];
  }

  return [uncontrolledValue, handleUncontrolledChange, false];
}
