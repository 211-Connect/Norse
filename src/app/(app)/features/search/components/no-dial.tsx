'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

import { noDialEnabled } from './no-dial-flag';

/**
 * Prototype safety switch (Lucas, 2026-11-14): while true, no 911, 988 or help-line control dials
 * or texts. Each one is a plain button that shows a short test-mode notice. Off by default
 * (production renders the normal `tel:` link); on when NEXT_PUBLIC_PROTOTYPE_NO_DIAL=true
 * (local prototype, demos).
 */
// Next.js inlines NEXT_PUBLIC_* only for a literal `process.env.NAME` read.
export const PROTOTYPE_NO_DIAL = noDialEnabled(
  process.env.NEXT_PUBLIC_PROTOTYPE_NO_DIAL,
);

/** The notice text for one number. Pure, so the tests can read it. */
export const noDialNotice = (number: string) =>
  `Test mode: no call placed (would call ${number})`;

/**
 * The one place a phone number becomes a control. In test mode it is a button that never
 * navigates; pressing it shows the notice next to it for a few seconds.
 */
export function DialButton({
  number,
  children,
  className,
  ariaLabel,
  testId,
}: {
  number: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}) {
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!PROTOTYPE_NO_DIAL) {
    return (
      <a
        href={`tel:${number}`}
        className={className}
        aria-label={ariaLabel}
        data-testid={testId}
      >
        {children}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`cursor-pointer ${className ?? ''}`}
        aria-label={ariaLabel}
        data-testid={testId}
        data-no-dial="true"
        onClick={() => {
          setShown(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setShown(false), 5000);
        }}
      >
        {children}
      </button>
      <span
        role="status"
        data-testid={testId ? `${testId}-notice` : 'no-dial-notice'}
        className={
          shown
            ? 'rounded-md border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900'
            : 'sr-only'
        }
      >
        {shown ? noDialNotice(number) : ''}
      </span>
    </>
  );
}
