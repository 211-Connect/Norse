import { Phone } from 'lucide-react';

import { DEFAULT_HOTLINES } from './search-follow-up';

/** The numbers come from the shared default hotlines (911 and 988), never a per-tenant list. */
const EMERGENCY_NUMBER =
  DEFAULT_HOTLINES.find((line) => line.number === '911')?.number ?? '911';
const CRISIS_NUMBER =
  DEFAULT_HOTLINES.find((line) => line.number === '988')?.number ?? '988';

const PILL =
  'inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-3 text-sm no-underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-4';

/**
 * The always-on emergency line (ADR 0039 Decision 45): 911 and the 988 crisis line, on every
 * search state, also when the danger check fails. It is calm on purpose, because most visitors
 * are not in danger. 911 is the stronger pill (red, bold); 988 is quieter (dark outline).
 * The short words show on a phone so both pills fit one row. Self-contained so the landing
 * page can reuse it.
 */
export function EmergencyLine() {
  return (
    <section
      aria-label="Emergency"
      className="flex flex-wrap items-center justify-center gap-x-2 border-b bg-white px-2.5 py-0.5 sm:justify-end print:hidden"
      data-testid="always-on-911"
    >
      <a
        href={`tel:${EMERGENCY_NUMBER}`}
        className={`${PILL} border-red-700 font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-red-700`}
        data-testid="always-on-911-link"
      >
        <Phone className="size-4 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">Call {EMERGENCY_NUMBER}</span>
        <span className="max-sm:hidden">
          In an emergency, call {EMERGENCY_NUMBER}
        </span>
      </a>
      <a
        href={`tel:${CRISIS_NUMBER}`}
        className={`${PILL} border-gray-500 font-medium text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-700`}
        data-testid="always-on-988-link"
      >
        <Phone className="size-4 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">Crisis line {CRISIS_NUMBER}</span>
        <span className="max-sm:hidden">
          Crisis line, call or text {CRISIS_NUMBER}
        </span>
      </a>
    </section>
  );
}
