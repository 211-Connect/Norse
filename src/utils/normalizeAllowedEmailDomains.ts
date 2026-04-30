export type AllowedEmailDomainValue =
  | { domain?: string | null }[]
  | string[]
  | string
  | null
  | undefined;

export function normalizeAllowedEmailDomains(
  value: AllowedEmailDomainValue,
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        return item?.domain ?? '';
      })
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}
