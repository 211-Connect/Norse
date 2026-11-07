import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import type { Resource } from '@/types/resource';

/**
 * The resource page's own URL, for `<link rel="canonical">` (ISS-2678). In v1 every page's canonical points to
 * itself (decided 2026-11-06; cross-site canonical is ISS-2676). The tenant's default locale is served without a
 * prefix, and the id is lower-cased so one resource has one URL.
 */
export function resourceCanonicalUrl({
  protocol,
  host,
  locale,
  defaultLocale,
  id,
}: {
  protocol: string;
  host: string;
  locale: string;
  defaultLocale: string;
  id: string;
}): string {
  const localePrefix = locale === defaultLocale ? '' : `/${locale}`;
  const path = withOptionalCustomBasePath(
    `${localePrefix}/search/${id.toLowerCase()}`,
  );
  return `${protocol}://${host}${path}`;
}

type JsonLd = Record<string, unknown>;

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Day names and the abbreviations WA211's hours use (`M`, `T`/`Tu`, `W`, `Th`, `F`, `Sa`, `Su`, …). */
const DAY_INDEX: Record<string, number> = Object.fromEntries(
  [
    ['m', 'mo', 'mon', 'monday'],
    ['t', 'tu', 'tue', 'tues', 'tuesday'],
    ['w', 'we', 'wed', 'wednesday'],
    ['th', 'thu', 'thur', 'thurs', 'thursday'],
    ['f', 'fr', 'fri', 'friday'],
    ['sa', 'sat', 'saturday'],
    ['su', 'sun', 'sunday'],
  ].flatMap((names, index) => names.map((name) => [name, index])),
);

const TIME = String.raw`(\d{1,2})(?::(\d{2}))?\s*(am|pm)?`;

/** "Monday 11:00am - 4:30pm" */
const LONG_SEGMENT = new RegExp(
  String.raw`^([a-z]+)\s+${TIME}\s*-\s*${TIME}$`,
  'i',
);

/** "M-F, 8am-4:30pm", "M, Tu, Th, F, 9am-6pm", "Sa, 10-2pm" */
const COMPACT_SEGMENT = new RegExp(
  String.raw`^([a-z ,-]+?)\s*,\s*${TIME}\s*-\s*${TIME}$`,
  'i',
);

const minutesOf = (hour: number, minute: number, meridiem: string) =>
  ((hour % 12) + (meridiem.toLowerCase() === 'pm' ? 12 : 0)) * 60 + minute;

const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * A time range in minutes. The end must say am or pm; a start without one takes the end's, unless that would
 * start at or after the end ("10-2pm" is 10am). Overnight ranges are not read.
 */
function timeRange([sh, sm, sa, eh, em, ea]: (string | undefined)[]):
  [number, number] | undefined {
  const startHour = Number(sh);
  const endHour = Number(eh);
  const startMinute = Number(sm ?? 0);
  const endMinute = Number(em ?? 0);
  if (!ea) return undefined;
  if ([startHour, endHour].some((h) => h < 1 || h > 12)) return undefined;
  if ([startMinute, endMinute].some((m) => m > 59)) return undefined;
  const end = minutesOf(endHour, endMinute, ea);
  let start = minutesOf(startHour, startMinute, sa ?? ea);
  if (!sa && start >= end) {
    const other = ea.toLowerCase() === 'pm' ? 'am' : 'pm';
    start = minutesOf(startHour, startMinute, other);
  }
  return start < end ? [start, end] : undefined;
}

/** "M-F" or "M, Tu, Th, F" as day indexes, in the order written. */
function daysOf(text: string): number[] | undefined {
  const days: number[] = [];
  for (const part of text.split(',').map((p) => p.trim())) {
    const [from, to, ...rest] = part
      .split('-')
      .map((day) => day.trim().toLowerCase());
    if (rest.length) return undefined;
    const first = DAY_INDEX[from];
    const last = to === undefined ? first : DAY_INDEX[to];
    if (first === undefined || last === undefined || last < first) {
      return undefined;
    }
    for (let day = first; day <= last; day++) days.push(day);
  }
  return days.length ? days : undefined;
}

function segmentHours(
  segment: string,
): [number[], [number, number]] | undefined {
  const long = LONG_SEGMENT.exec(segment);
  if (long) {
    // The long form spells the day out in full.
    const day = DAYS.findIndex(
      (d) => d.toLowerCase() === long[1].toLowerCase(),
    );
    const range = timeRange(long.slice(2));
    return day >= 0 && range ? [[day], range] : undefined;
  }
  const compact = COMPACT_SEGMENT.exec(segment);
  if (!compact) return undefined;
  const days = daysOf(compact[1]);
  const range = timeRange(compact.slice(2));
  return days && range ? [days, range] : undefined;
}

const openingHours = (day: number, opens: string, closes: string): JsonLd => ({
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: `https://schema.org/${DAYS[day]}`,
  opens,
  closes,
});

/**
 * The record's hours as schema.org opening hours, only when the whole text reads as `;`-separated day groups
 * with one time range each ("M-F, 8am-5pm.", "Monday 11:00am - 4:30pm"), or is "24 hours daily". Anything else
 * (a label, a note, several lines, "by appointment") is left out rather than guessed: the page still shows the
 * text.
 */
export function parseOpeningHours(
  hours: string | null | undefined,
): JsonLd[] | undefined {
  const body = (hours ?? '').trim().replace(/\.$/, '').trim();
  if (/^24 hours daily$/i.test(body)) {
    return DAYS.map((_, day) => openingHours(day, '00:00', '23:59'));
  }
  const segments = body
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return undefined;

  const specs: JsonLd[] = [];
  for (const segment of segments) {
    const parsed = segmentHours(segment);
    if (!parsed) return undefined;
    const [days, [opens, closes]] = parsed;
    for (const day of days) {
      specs.push(openingHours(day, hhmm(opens), hhmm(closes)));
    }
  }
  return specs;
}

const text = (value: string | null | undefined) => value?.trim() || undefined;

/** Drops keys whose value is undefined or an empty object, so nothing is written as null or empty. */
function compact(value: JsonLd): JsonLd | undefined {
  const entries = Object.entries(value).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  const hasContent = entries.some(([key]) => key !== '@type');
  return hasContent ? Object.fromEntries(entries) : undefined;
}

function postalAddress(resource: Resource): JsonLd | undefined {
  const address =
    resource.addresses?.find((a) => a.type === 'physical' && a.rank === 1) ??
    resource.addresses?.find((a) => a.rank === 1) ??
    resource.addresses?.[0];
  if (!address) {
    return compact({
      '@type': 'PostalAddress',
      streetAddress: text(resource.address),
    });
  }
  return compact({
    '@type': 'PostalAddress',
    streetAddress:
      [text(address.address_1), text(address.address_2)]
        .filter(Boolean)
        .join(', ') || undefined,
    addressLocality: text(address.city),
    addressRegion: text(address.stateProvince),
    postalCode: text(address.postalCode),
    addressCountry: text(address.country),
  });
}

/**
 * schema.org JSON-LD for a resource page (ISS-2678): a `Service` provided by an `Organization`, with its phone,
 * address and hours where the record has them. Built from the record only; nothing comes from the URL.
 */
export function resourceJsonLd(
  resource: Resource,
  url: string,
): JsonLd | undefined {
  const name = text(resource.serviceName) ?? text(resource.name);
  if (!name) return undefined;

  // No coordinates: some records carry coordinates that contradict their address (ISS-2678), and the address
  // alone identifies the place. A place without an address is not a location.
  const address = postalAddress(resource);
  const serviceLocation = address
    ? compact({
        '@type': 'Place',
        name: text(resource.locationName),
        address,
      })
    : undefined;

  const channel = compact({
    '@type': 'ServiceChannel',
    serviceUrl: text(resource.website),
    servicePhone: compact({
      '@type': 'ContactPoint',
      telephone: text(resource.phone),
      email: text(resource.email),
    }),
    serviceLocation,
  });

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    url,
    description: text(resource.description),
    provider: compact({
      '@type': 'Organization',
      name: text(resource.organizationName),
      url: text(resource.organizationUrl),
    }),
    availableChannel: channel,
    hoursAvailable: parseOpeningHours(resource.hours),
  });
}

/**
 * JSON for an inline `<script type="application/ld+json">`. `<`, `>`, `&` and the JavaScript line separators are
 * escaped as JSON unicode escapes, so record text can never close the script or open an HTML comment, and the
 * JSON reads back unchanged.
 */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}
