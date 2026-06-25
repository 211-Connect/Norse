export function parseCommaSeparatedValues(
  rawValue: string | string[] | undefined,
): string[] | undefined {
  if (!rawValue) {
    return undefined;
  }

  const values = (Array.isArray(rawValue) ? rawValue : [rawValue])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    return undefined;
  }

  return [...new Set(values)];
}
