import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

import { NO_DIAL } from '@/app/(app)/features/search/components/no-dial-flag';

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
/**
 * The `tel:` link for a provider phone number, or '' for "no link". While the no-dial switch is on
 * (`NO_DIAL`, every environment until the turn-on PR, Lucas 2026-11-20) it is always '', so cards
 * and resource pages show the number as text. With the switch off the v1 rules apply: extensions
 * use a pause (`,`) rather than RFC 3966 `;ext=`, because phone dialers dial the pause and ignore
 * `;ext=`, and a number that does not parse keeps its raw text.
 */
export function getPhoneHref(
  raw: string | null | undefined,
  { noDial = NO_DIAL }: { noDial?: boolean } = {},
): string {
  if (noDial || !raw) {
    return '';
  }

  const phone = parse(raw);
  if (!phone) {
    return `tel:${raw.trim()}`;
  }

  return `tel:${phone.number}${phone.ext ? `,${phone.ext}` : ''}`;
}
