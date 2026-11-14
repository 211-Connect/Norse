import { Phone } from 'lucide-react';

import { DEFAULT_HOTLINES } from './search-follow-up';

/** The numbers come from the shared default hotlines (911 and 988), never a per-tenant list. */
const EMERGENCY_NUMBER =
  DEFAULT_HOTLINES.find((line) => line.number === '911')?.number ?? '911';
const CRISIS_NUMBER =
  DEFAULT_HOTLINES.find((line) => line.number === '988')?.number ?? '988';

/**
 * Small chip. The after: box grows the tap area to 44 px high without making the chip bigger.
 * The chips sit 8 px above the search box, so the grown area stops at the box.
 */
const CHIP =
  'relative inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs no-underline after:absolute after:-inset-y-2 after:inset-x-0 after:content-[""] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none';

/**
 * The always-on emergency line (ADR 0039 Decision 45): two small chips, 911 and the 988 crisis
 * line, directly above a search box, on every search state, also when the danger check fails.
 * It is calm on purpose, because most visitors are not in danger. 911 is the stronger chip
 * (red, bold); 988 is quieter (gray outline). It has no bar and no width of its own: it takes
 * the width of the column it is put in, so it lines up with the search box. Self-contained so
 * the landing page can reuse it above its own search box.
 */
export function EmergencyLine() {
  return (
    <section
      aria-label="Emergency"
      className="mb-2 flex flex-wrap items-center gap-1.5 print:hidden"
      data-testid="always-on-911"
    >
      <a
        href={`tel:${EMERGENCY_NUMBER}`}
        className={`${CHIP} border-red-700 bg-red-50 font-semibold text-red-700 hover:bg-red-100 focus-visible:ring-red-700`}
        data-testid="always-on-911-link"
      >
        <Phone className="size-3 shrink-0" aria-hidden="true" />
        Emergency: call {EMERGENCY_NUMBER}
      </a>
      <a
        href={`tel:${CRISIS_NUMBER}`}
        className={`${CHIP} border-gray-400 bg-white font-medium text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-700`}
        data-testid="always-on-988-link"
      >
        <Phone className="size-3 shrink-0" aria-hidden="true" />
        Crisis line: {CRISIS_NUMBER}
        <span className="sr-only"> (call or text)</span>
      </a>
    </section>
  );
}
