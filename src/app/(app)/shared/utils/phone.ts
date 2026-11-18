import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

// Norse tenants are US 211 directories; numbers without a country code are
// interpreted as US numbers.
const DEFAULT_COUNTRY = 'US';

const parse = (raw: string) => {
  const phone = parsePhoneNumberFromString(raw, DEFAULT_COUNTRY);
  return phone?.isPossible() ? phone : undefined;
};

/**
 * Human-readable phone number, e.g. `(253) 403-4437;ext=2` →
 * `(253) 403-4437 ext. 2`. Unparseable values are returned trimmed but
 * otherwise unchanged.
 */
export function formatPhoneNumber(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }

  const phone = parse(raw);
  if (!phone) {
    return raw.trim();
  }

  return phone.country === DEFAULT_COUNTRY
    ? phone.formatNational()
    : phone.formatInternational();
}

/**
 * Provider phone numbers never dial (Lucas, 2026-11-18, for good): no `tel:` link for a service
 * number, so cards and resource pages show the number as text. The 911, 988, 211 and sms help lines
 * do not use this function; they dial through `DialButton` (features/search/components/no-dial.tsx).
 * An empty string means "no link".
 */
export function getPhoneHref(_raw?: string | null): string {
  return '';
}
