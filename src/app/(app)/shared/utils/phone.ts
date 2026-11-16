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
 * `tel:` URI for a phone number. Extensions use a pause (`,`) rather than
 * RFC 3966 `;ext=`, because phone dialers dial the pause and ignore `;ext=`.
 */
// Prototype: the live-data demo shows real service numbers, so no Call button may dial them.
// Same intent as PROTOTYPE_NO_DIAL in features/search/components/no-dial.tsx (a client module).
const PROTOTYPE_NO_DIAL_SERVICES = true;

export function getPhoneHref(raw: string | null | undefined): string {
  if (!raw || PROTOTYPE_NO_DIAL_SERVICES) {
    return '';
  }

  const phone = parse(raw);
  if (!phone) {
    return `tel:${raw.trim()}`;
  }

  return `tel:${phone.number}${phone.ext ? `,${phone.ext}` : ''}`;
}
