'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

import { NO_DIAL } from './no-dial-flag';

/** The no-dial switch; see `no-dial-flag.ts`. ON until the turn-on PR. */
export const PROTOTYPE_NO_DIAL = NO_DIAL;

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
