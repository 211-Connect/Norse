export const getNumberFromString = (
  value: string | number | undefined,
  defaultValue: number,
): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
};
