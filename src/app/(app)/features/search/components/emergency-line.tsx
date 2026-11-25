import { Phone } from 'lucide-react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { DialButton } from './dial-button';
import type { V2Hotline } from '../v2/v2-contract';

/**
 * Small chip. The after: box grows the tap area to 44 px high without making the chip bigger.
 * The chips sit 8 px above the search box, so the grown area stops at the box.
 */
const CHIP =
  'relative inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs no-underline after:absolute after:-inset-y-2 after:inset-x-0 after:content-[""] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none';

/**
 * 911 and 988: the last chips of every emergency line (Lucas, 2026-11-24). The tenant's own
 * hotlines and the API's come before them.
 */
export const DEFAULT_HOTLINES: V2Hotline[] = [
  { label: 'Emergency: call 911', number: '911' },
  { label: 'Crisis line', number: '988' },
];

/** The dialed digits of a number: "9-8-8" and "(988)" are 988; "1-800-..." is the same as "800-...". */
function digitsOf(number: string): string {
  const digits = number.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;
}

/**
 * The numbers of the emergency line: every list in the order given (tenant first, then the API's),
 * then 911 and 988. A number that repeats (same digits, so "9-8-8" is 988) is drawn once, and the
 * first label wins. Entries with no label, no number or no digit are dropped. Never empty.
 */
export function emergencyLineHotlines(
  ...lists: (readonly unknown[] | null | undefined)[]
): V2Hotline[] {
  const seen = new Set<string>();
  const out: V2Hotline[] = [];
  for (const list of [...lists, DEFAULT_HOTLINES]) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const { label, number } = (item ?? {}) as Record<string, unknown>;
      if (typeof label !== 'string' || typeof number !== 'string') continue;
      if (!label.trim() || !number.trim()) continue;
      const key = digitsOf(number);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ label: label.trim(), number: number.trim() });
    }
  }
  return out;
}

/**
 * The popup's Call buttons: the same list as the chip row (tenant, the API's, then 911 and 988, no
 * number twice), also when the API sent only the tenant's numbers (Lucas, 2026-11-25, F-1 = A).
 */
export const popupHotlines = (hotlines: V2Hotline[], tenant?: V2Hotline[]) =>
  emergencyLineHotlines(tenant, hotlines);

/**
 * The always-on emergency line (ADR 0039 Decision 45): small chips directly above a search box.
 * Order: the tenant's hotlines (app config), the numbers the API sent with the emergency question
 * (`hotlines`, results page only), then 911 and 988, with no number twice. It is never empty, also
 * when the v2 call failed. The first number is the stronger chip (red, bold); the others are
 * quieter (gray outline). It has no bar and no width of its own.
 */
export function EmergencyLine({ hotlines }: { hotlines?: V2Hotline[] }) {
  const tenant = useAppConfig()?.search?.hotlines;
  const lines = emergencyLineHotlines(tenant, hotlines);
  return (
    <section
      aria-label="Emergency"
      className="mb-2 flex flex-wrap items-center gap-1.5 print:hidden"
      data-testid="always-on-911"
    >
      {lines.map((line, i) => (
        <DialButton
          key={line.number}
          number={line.number}
          ariaLabel={`Call ${line.number}, ${line.label}`}
          className={`${CHIP} ${
            i === 0
              ? 'border-red-700 bg-red-50 font-semibold text-red-700 hover:bg-red-100 focus-visible:ring-red-700'
              : 'border-gray-400 bg-white font-medium text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-700'
          }`}
          testId={`always-on-${line.number}-link`}
        >
          <Phone className="size-3 shrink-0" aria-hidden="true" />
          {line.label}: {line.number}
        </DialButton>
      ))}
    </section>
  );
}
