export function omitNullish<T extends Record<string, any>>(
  obj: T,
): {
  [K in keyof T as T[K] extends null | undefined ? never : K]: T[K];
} {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value != null && value !== ''),
  ) as any;
}
