import { useCallback, useState } from 'react';

type ChangeHandler<T> = (value: T, ...payload: any[]) => void;

interface UseUncontrolledStateProps<T> {
  value?: T;
  defaultValue?: T;
  onChange?: ChangeHandler<T>;
}

export function useUncontrolledState<T>({
  value,
  defaultValue,
  onChange = () => {},
}: UseUncontrolledStateProps<T>): [T, ChangeHandler<T>, boolean] {
  if (value === undefined && defaultValue === undefined) {
    throw new Error(
      'useUncontrolled: You must provide either a value or a defaultValue',
    );
  }

  const [uncontrolledValue, setUncontrolledValue] = useState<T>(() => {
    return defaultValue as T;
  });

  const handleChange = useCallback<ChangeHandler<T>>(
    (val, ...args) => {
      setUncontrolledValue(val);
      onChange(val, ...args);
    },
    [onChange],
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const changeHandler = isControlled ? onChange : handleChange;

  return [currentValue, changeHandler, isControlled];
}
