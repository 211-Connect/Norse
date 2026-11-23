import { Phone } from 'lucide-react';

import { DialButton } from './dial-button';
import type { V2Hotline } from '../v2/v2-contract';

/**
 * Small chip. The after: box grows the tap area to 44 px high without making the chip bigger.
 * The chips sit 8 px above the search box, so the grown area stops at the box.
 */
const CHIP =
  'relative inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs no-underline after:absolute after:-inset-y-2 after:inset-x-0 after:content-[""] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none';

/**
 * Pages with no search response (the landing page, the need form) keep this default line
 * (Lucas, 2026-11-23). On a search response the API's `hotlines[]` govern, and none sent draws nothing.
 */
export const DEFAULT_HOTLINES: V2Hotline[] = [
  { label: 'Emergency: call 911', number: '911' },
  { label: 'Crisis line', number: '988' },
];

/**
 * The always-on emergency line (ADR 0039 Decision 45): small chips for the numbers the API sent
 * with the emergency question (`hotlines[]`), directly above a search box. On a search response the UI has no default
 * list (contract v2): with no numbers it draws nothing. The first number is the stronger chip
 * (red, bold); the others are quieter (gray outline). It has no bar and no width of its own.
 */
export function EmergencyLine({ hotlines = [] }: { hotlines?: V2Hotline[] }) {
  if (hotlines.length === 0) return null;
  return (
    <section
      aria-label="Emergency"
      className="mb-2 flex flex-wrap items-center gap-1.5 print:hidden"
      data-testid="always-on-911"
    >
      {hotlines.map((line, i) => (
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
