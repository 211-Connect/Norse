import { Phone } from 'lucide-react';

/**
 * The always-on "call 911" line (ADR 0039 Decision 45). It shows on every search state, also
 * when the danger check fails. It is calm on purpose: most visitors are not in danger. The red
 * outline, the phone icon and the words "call 911" keep it findable in one second without a
 * loud banner. Self-contained so the landing page can reuse it.
 */
export function EmergencyLine() {
  return (
    <section
      aria-label="Emergency"
      className="flex items-center justify-end border-b bg-white px-2.5 print:hidden"
      data-testid="always-on-911"
    >
      <a
        href="tel:911"
        className="my-0.5 inline-flex min-h-11 items-center gap-2 rounded-full border border-red-700 bg-white px-4 text-sm font-semibold text-red-700 no-underline hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Phone className="size-4" aria-hidden="true" />
        In an emergency, call 911
      </a>
    </section>
  );
}
