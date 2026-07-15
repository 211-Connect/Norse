export function normalizeIndexedCollection<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, entry]) => entry);
}
