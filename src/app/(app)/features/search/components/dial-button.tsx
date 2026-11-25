import { ReactNode } from 'react';

import { getPhoneHref } from '@/app/(app)/shared/utils/phone';

/** The one place a hotline or help-line number becomes a control: a `tel:` link. */
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
  return (
    <a
      href={getPhoneHref(number) || `tel:${number}`}
      className={className}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </a>
  );
}
